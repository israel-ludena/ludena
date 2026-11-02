import prisma from "@/database";
import { CreateDishBodyType, UpdateDishBodyType } from "@/schemaValidations/dish.schema";

// Todas las funciones reciben el restaurante: un local nunca ve ni modifica platos de otro.

export const getDishList = (restaurantId: number) => {
  return prisma.dish.findMany({
    where: { restaurantId },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getDishDetail = (id: number, restaurantId?: number) => {
  return prisma.dish.findFirstOrThrow({
    where: {
      id,
      ...(restaurantId ? { restaurantId } : {}),
    },
  });
};

export const createDish = (restaurantId: number, data: CreateDishBodyType) => {
  return prisma.dish.create({
    data: { ...data, restaurantId },
  });
};

export const updateDish = async (restaurantId: number, id: number, data: UpdateDishBodyType) => {
  await getDishDetail(id, restaurantId);
  return prisma.dish.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteDish = async (restaurantId: number, id: number) => {
  await getDishDetail(id, restaurantId);
  return prisma.dish.delete({
    where: {
      id,
    },
  });
};
