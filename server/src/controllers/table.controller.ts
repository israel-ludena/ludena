import prisma from "@/database";
import { CreateTableBodyType, UpdateTableBodyType } from "@/schemaValidations/table.schema";
import { EntityError, isPrismaClientKnownRequestError } from "@/utils/errors";
import { Prisma } from "@prisma/client";
import { randomId } from "@/utils/helpers";

// Las mesas se identifican por su número dentro de cada restaurante.

export const getTableList = (restaurantId: number) => {
  return prisma.table.findMany({
    where: { restaurantId },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getTableDetail = (restaurantId: number, number: number) => {
  return prisma.table.findUniqueOrThrow({
    where: {
      restaurantId_number: { restaurantId, number },
    },
  });
};

export const createTable = async (restaurantId: number, data: CreateTableBodyType) => {
  const token = randomId();
  try {
    const result = await prisma.table.create({
      data: {
        ...data,
        restaurantId,
        token,
      },
    });
    return result;
  } catch (error) {
    if (isPrismaClientKnownRequestError(error) && error.code === "P2002") {
      throw new EntityError([
        {
          message: "Ese número de mesa ya existe",
          field: "number",
        },
      ]);
    }
    throw error;
  }
};

export const updateTable = async (restaurantId: number, number: number, data: UpdateTableBodyType) => {
  const where = { restaurantId_number: { restaurantId, number } };
  if (data.changeToken) {
    const token = randomId();
    const current = await prisma.table.findUniqueOrThrow({ where });
    // Al cambiar el QR se invalidan las sesiones de los clientes de esa mesa
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const [table] = await Promise.all([
        tx.table.update({
          where,
          data: {
            status: data.status,
            capacity: data.capacity,
            token,
          },
        }),
        tx.guest.updateMany({
          where: {
            tableId: current.id,
          },
          data: {
            refreshToken: null,
            refreshTokenExpiresAt: null,
          },
        }),
      ]);
      return table;
    });
  }
  return prisma.table.update({
    where,
    data: {
      status: data.status,
      capacity: data.capacity,
    },
  });
};

export const deleteTable = (restaurantId: number, number: number) => {
  return prisma.table.delete({
    where: {
      restaurantId_number: { restaurantId, number },
    },
  });
};
