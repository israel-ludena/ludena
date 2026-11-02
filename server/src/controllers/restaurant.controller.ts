import { PrismaErrorCode } from "@/constants/error-reference";
import { Role } from "@/constants/type";
import prisma from "@/database";
import { RegisterRestaurantBodyType, UpdateRestaurantBodyType } from "@/schemaValidations/restaurant.schema";
import { hashPassword } from "@/utils/crypto";
import { EntityError, isPrismaClientKnownRequestError } from "@/utils/errors";

/** Registro público de un restaurante nuevo con su cuenta de dueño. */
export const registerRestaurantController = async (body: RegisterRestaurantBodyType) => {
  const [slugTaken, emailTaken] = await Promise.all([
    prisma.restaurant.findUnique({ where: { slug: body.slug }, select: { id: true } }),
    prisma.account.findUnique({ where: { email: body.email }, select: { id: true } }),
  ]);
  const errors = [];
  if (slugTaken) errors.push({ field: "slug", message: "Esa dirección ya está en uso; prueba con otra" });
  if (emailTaken) errors.push({ field: "email", message: "El correo ya existe" });
  if (errors.length) throw new EntityError(errors);

  const hashedPassword = await hashPassword(body.password);
  try {
    return await prisma.restaurant.create({
      data: {
        name: body.restaurantName,
        slug: body.slug,
        phone: body.phone,
        address: body.address,
        accounts: {
          create: {
            name: body.ownerName,
            email: body.email,
            password: hashedPassword,
            role: Role.Owner,
          },
        },
      },
    });
  } catch (error) {
    if (isPrismaClientKnownRequestError(error) && error.code === PrismaErrorCode.UniqueConstraintViolation) {
      throw new EntityError([{ field: "slug", message: "Esa dirección o correo ya está en uso" }]);
    }
    throw error;
  }
};

export const getRestaurantBySlugController = (slug: string) => {
  return prisma.restaurant.findUniqueOrThrow({ where: { slug } });
};

export const getMyRestaurantController = (restaurantId: number) => {
  return prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
};

export const updateMyRestaurantController = (restaurantId: number, body: UpdateRestaurantBodyType) => {
  return prisma.restaurant.update({ where: { id: restaurantId }, data: body });
};
