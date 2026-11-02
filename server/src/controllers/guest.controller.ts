import envConfig from "@/config";
import { DishStatus, OrderStatus, Role, TableStatus } from "@/constants/type";
import prisma from "@/database";
import { GuestCreateOrdersBodyType, GuestLoginBodyType } from "@/schemaValidations/guest.schema";
import { TokenPayload } from "@/types/jwt.types";
import { AuthError } from "@/utils/errors";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { Prisma } from "@prisma/client";

export const guestLoginController = async (body: GuestLoginBodyType) => {
  const table = await prisma.table.findUnique({
    where: {
      number: body.tableNumber,
      token: body.token,
    },
  });
  if (!table) {
    throw new Error("La mesa no existe o el token no es válido");
  }

  if (table.status === TableStatus.Hidden) {
    throw new Error("Esta mesa está oculta; elige otra mesa para ingresar");
  }

  if (table.status === TableStatus.Reserved) {
    throw new Error("La mesa está reservada; pide ayuda al personal");
  }

  let guest = await prisma.guest.create({
    data: {
      name: body.name,
      tableNumber: body.tableNumber,
    },
  });
  const refreshToken = signRefreshToken(
    {
      userId: guest.id,
      role: Role.Guest,
    },
    {
      expiresIn: envConfig.GUEST_REFRESH_TOKEN_EXPIRES_IN,
    }
  );
  const accessToken = signAccessToken(
    {
      userId: guest.id,
      role: Role.Guest,
    },
    {
      expiresIn: envConfig.GUEST_ACCESS_TOKEN_EXPIRES_IN,
    }
  );
  const decodedRefreshToken = verifyRefreshToken(refreshToken);
  const refreshTokenExpiresAt = new Date(decodedRefreshToken.exp * 1000);

  guest = await prisma.guest.update({
    where: {
      id: guest.id,
    },
    data: {
      refreshToken,
      refreshTokenExpiresAt,
    },
  });

  return {
    guest,
    accessToken,
    refreshToken,
  };
};

export const guestLogoutController = async (id: number) => {
  await prisma.guest.update({
    where: {
      id,
    },
    data: {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    },
  });
  return "Sesión cerrada";
};

export const guestRefreshTokenController = async (refreshToken: string) => {
  let decodedRefreshToken: TokenPayload;
  try {
    decodedRefreshToken = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new AuthError("Refresh token no válido");
  }
  const newRefreshToken = signRefreshToken({
    userId: decodedRefreshToken.userId,
    role: Role.Guest,
    exp: decodedRefreshToken.exp,
  });
  const newAccessToken = signAccessToken(
    {
      userId: decodedRefreshToken.userId,
      role: Role.Guest,
    },
    {
      expiresIn: envConfig.GUEST_ACCESS_TOKEN_EXPIRES_IN,
    }
  );
  await prisma.guest.update({
    where: {
      id: decodedRefreshToken.userId,
    },
    data: {
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const guestCreateOrdersController = async (guestId: number, body: GuestCreateOrdersBodyType) => {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const guest = await tx.guest.findUniqueOrThrow({
      where: {
        id: guestId,
      },
    });
    if (guest.tableNumber === null) {
      throw new Error("Tu mesa fue eliminada; cierra sesión e ingresa en otra mesa");
    }
    const table = await tx.table.findUniqueOrThrow({
      where: {
        number: guest.tableNumber,
      },
    });
    if (table.status === TableStatus.Hidden) {
      throw new Error(`La mesa ${table.number} está oculta; cierra sesión y elige otra mesa`);
    }
    if (table.status === TableStatus.Reserved) {
      throw new Error(`La mesa ${table.number} está reservada; cierra sesión y elige otra mesa`);
    }
    const orders = await Promise.all(
      body.map(async (order) => {
        const dish = await tx.dish.findUniqueOrThrow({
          where: {
            id: order.dishId,
          },
        });
        if (dish.status === DishStatus.Unavailable) {
          throw new Error(`El plato ${dish.name} está agotado`);
        }
        if (dish.status === DishStatus.Hidden) {
          throw new Error(`El plato ${dish.name} no se puede pedir`);
        }
        const dishSnapshot = await tx.dishSnapshot.create({
          data: {
            description: dish.description,
            image: dish.image,
            name: dish.name,
            price: dish.price,
            dishId: dish.id,
            status: dish.status,
          },
        });
        const orderRecord = await tx.order.create({
          data: {
            dishSnapshotId: dishSnapshot.id,
            guestId,
            quantity: order.quantity,
            tableNumber: guest.tableNumber,
            orderHandlerId: null,
            status: OrderStatus.Pending,
          },
          include: {
            dishSnapshot: true,
            guest: true,
            orderHandler: true,
          },
        });
        type OrderRecord = typeof orderRecord;
        return orderRecord as OrderRecord & {
          status: (typeof OrderStatus)[keyof typeof OrderStatus];
          dishSnapshot: OrderRecord["dishSnapshot"] & {
            status: (typeof DishStatus)[keyof typeof DishStatus];
          };
        };
      })
    );
    return orders;
  });
  return result;
};

export const guestGetOrdersController = async (guestId: number) => {
  const orders = await prisma.order.findMany({
    where: {
      guestId,
    },
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true,
    },
  });
  return orders;
};
