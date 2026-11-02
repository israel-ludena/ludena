import envConfig from "@/config";
import { PrismaErrorCode } from "@/constants/error-reference";
import { Role, TableStatus } from "@/constants/type";
import prisma from "@/database";
import {
  ChangePasswordBodyType,
  CreateEmployeeAccountBodyType,
  CreateGuestBodyType,
  UpdateEmployeeAccountBodyType,
  UpdateMeBodyType,
} from "@/schemaValidations/account.schema";
import { comparePassword, hashPassword } from "@/utils/crypto";
import { EntityError, isPrismaClientKnownRequestError } from "@/utils/errors";
import { getChalk } from "@/utils/helpers";

// Al arrancar por primera vez crea un restaurante de demostración con su dueño
export const initOwnerAccount = async () => {
  const accountCount = await prisma.account.count();
  if (accountCount === 0) {
    const hashedPassword = await hashPassword(envConfig.INITIAL_PASSWORD_OWNER);
    const restaurant = await prisma.restaurant.create({
      data: { name: "Restaurante Demo", slug: "demo" },
    });
    await prisma.account.create({
      data: {
        name: "Dueño Demo",
        email: envConfig.INITIAL_EMAIL_OWNER,
        password: hashedPassword,
        role: Role.Owner,
        restaurantId: restaurant.id,
      },
    });
    const chalk = await getChalk();
    console.log(
      chalk.bgCyan(
        `Cuenta del dueño creada: ${envConfig.INITIAL_EMAIL_OWNER}|${envConfig.INITIAL_PASSWORD_OWNER}`
      )
    );
  }
};

export const createEmployeeAccount = async (restaurantId: number, body: CreateEmployeeAccountBodyType) => {
  try {
    const hashedPassword = await hashPassword(body.password);
    const account = await prisma.account.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: Role.Employee,
        avatar: body.avatar,
        restaurantId,
      },
    });
    return account;
  } catch (error: unknown) {
    if (isPrismaClientKnownRequestError(error)) {
      if (error.code === PrismaErrorCode.UniqueConstraintViolation) {
        throw new EntityError([{ field: "email", message: "El correo ya existe" }]);
      }
    }
    throw error;
  }
};

export const getEmployeeAccounts = async (restaurantId: number) => {
  const accounts = await prisma.account.findMany({
    where: {
      role: Role.Employee,
      restaurantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return accounts;
};

export const getEmployeeAccount = async (restaurantId: number, accountId: number) => {
  const account = await prisma.account.findFirstOrThrow({
    where: {
      id: accountId,
      restaurantId,
    },
  });
  return account;
};

export const getAccountList = async (restaurantId: number) => {
  const account = await prisma.account.findMany({
    where: { restaurantId },
    orderBy: {
      createdAt: "desc",
    },
  });
  return account;
};

export const updateEmployeeAccount = async (
  restaurantId: number,
  accountId: number,
  body: UpdateEmployeeAccountBodyType
) => {
  try {
    await getEmployeeAccount(restaurantId, accountId);
    const [socketRecord, oldAccount] = await Promise.all([
      prisma.socket.findUnique({
        where: {
          accountId,
        },
      }),
      prisma.account.findUnique({
        where: {
          id: accountId,
        },
      }),
    ]);
    if (!oldAccount) {
      throw new EntityError([{ field: "email", message: "La cuenta que intentas actualizar ya no existe" }]);
    }
    const isChangeRole = oldAccount.role !== body.role;
    if (body.changePassword) {
      const hashedPassword = await hashPassword(body.password!);
      const account = await prisma.account.update({
        where: {
          id: accountId,
        },
        data: {
          name: body.name,
          email: body.email,
          avatar: body.avatar,
          password: hashedPassword,
          role: body.role,
        },
      });
      return {
        account,
        socketId: socketRecord?.socketId,
        isChangeRole,
      };
    } else {
      const account = await prisma.account.update({
        where: {
          id: accountId,
        },
        data: {
          name: body.name,
          email: body.email,
          avatar: body.avatar,
          role: body.role,
        },
      });
      return {
        account,
        socketId: socketRecord?.socketId,
        isChangeRole,
      };
    }
  } catch (error: unknown) {
    if (isPrismaClientKnownRequestError(error)) {
      if (error.code === PrismaErrorCode.UniqueConstraintViolation) {
        throw new EntityError([{ field: "email", message: "El correo ya existe" }]);
      }
    }
    throw error;
  }
};

export const deleteEmployeeAccount = async (restaurantId: number, accountId: number) => {
  await getEmployeeAccount(restaurantId, accountId);
  const socketRecord = await prisma.socket.findUnique({
    where: {
      accountId,
    },
  });
  const account = await prisma.account.delete({
    where: {
      id: accountId,
    },
  });
  return {
    account,
    socketId: socketRecord?.socketId,
  };
};

export const getMeController = async (accountId: number) => {
  const account = prisma.account.findUniqueOrThrow({
    where: {
      id: accountId,
    },
  });
  return account;
};

export const updateMeController = async (accountId: number, body: UpdateMeBodyType) => {
  const account = prisma.account.update({
    where: {
      id: accountId,
    },
    data: body,
  });
  return account;
};

export const changePasswordController = async (accountId: number, body: ChangePasswordBodyType) => {
  const account = await prisma.account.findUniqueOrThrow({
    where: {
      id: accountId,
    },
  });
  const isSame = await comparePassword(body.oldPassword, account.password);
  if (!isSame) {
    throw new EntityError([{ field: "oldPassword", message: "La contraseña actual no es correcta" }]);
  }
  const hashedPassword = await hashPassword(body.password);
  const newAccount = await prisma.account.update({
    where: {
      id: accountId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return newAccount;
};

export const getGuestList = async (
  restaurantId: number,
  { fromDate, toDate }: { fromDate?: Date; toDate?: Date }
) => {
  const orders = await prisma.guest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      restaurantId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });
  return orders;
};

export const createGuestController = async (restaurantId: number, body: CreateGuestBodyType) => {
  const table = await prisma.table.findUnique({
    where: {
      restaurantId_number: { restaurantId, number: body.tableNumber },
    },
  });
  if (!table) {
    throw new Error("La mesa no existe");
  }

  if (table.status === TableStatus.Hidden) {
    throw new Error(`La mesa ${table.number} está oculta; elige otra mesa`);
  }
  const guest = await prisma.guest.create({
    data: {
      name: body.name,
      restaurantId,
      tableId: table.id,
      tableNumber: table.number,
    },
  });
  return guest;
};
