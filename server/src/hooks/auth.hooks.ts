import { Role } from "@/constants/type";
import { AuthError, EntityError } from "@/utils/errors";
import { verifyAccessToken } from "@/utils/jwt";
import prisma from "@/database";
import { FastifyRequest } from "fastify";

export const pauseApiHook = async (_request: FastifyRequest) => {
  // throw new ForbiddenError('Chức năng bị tạm ngưng')
};

export const requireLoginedHook = async (request: FastifyRequest) => {
  const accessToken = request.headers.authorization?.split(" ")[1];
  if (!accessToken) throw new AuthError("No se recibió el access token");
  try {
    const decodedAccessToken = verifyAccessToken(accessToken);
    request.decodedAccessToken = decodedAccessToken;
  } catch (_error) {
    throw new AuthError("Access token no válido");
  }
  request.restaurantId = await getRestaurantIdForUser(request.decodedAccessToken);
};

/**
 * Devuelve el restaurante al que pertenece el usuario del token.
 * Se consulta en la base en cada petición para que un cambio de restaurante o un borrado aplique de inmediato.
 */
export const getRestaurantIdForUser = async ({ userId, role }: { userId: number; role: string }) => {
  if (role === Role.Guest) {
    const guest = await prisma.guest.findUnique({ where: { id: userId }, select: { restaurantId: true } });
    if (!guest) throw new AuthError("El cliente ya no existe");
    return guest.restaurantId;
  }
  const account = await prisma.account.findUnique({ where: { id: userId }, select: { restaurantId: true } });
  if (!account?.restaurantId) throw new AuthError("La cuenta no pertenece a ningún restaurante");
  return account.restaurantId;
};

/** Para rutas protegidas: el restaurante del usuario ya validado por requireLoginedHook. */
export const getRequestRestaurantId = (request: FastifyRequest) => {
  if (!request.restaurantId) throw new AuthError("No se pudo identificar el restaurante");
  return request.restaurantId;
};

export const requireOwnerHook = async (request: FastifyRequest) => {
  if (request.decodedAccessToken?.role !== Role.Owner) {
    throw new AuthError("No tienes permiso para acceder");
  }
};

export const requireEmployeeHook = async (request: FastifyRequest) => {
  if (request.decodedAccessToken?.role !== Role.Employee) {
    throw new AuthError("No tienes permiso para acceder");
  }
};

export const requireGuestHook = async (request: FastifyRequest) => {
  if (request.decodedAccessToken?.role !== Role.Guest) {
    throw new AuthError("No tienes permiso para acceder");
  }
};

/**
 * Para rutas públicas (carta del comensal): usa `?restaurant={slug}`.
 * Si no viene el slug pero hay sesión válida, usa el restaurante del usuario.
 */
export const resolvePublicRestaurantId = async (request: FastifyRequest, slug?: string) => {
  if (slug) {
    const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
    if (!restaurant) throw new EntityError([{ field: "restaurant", message: "El restaurante no existe" }]);
    return restaurant.id;
  }
  const accessToken = request.headers.authorization?.split(" ")[1];
  if (accessToken) {
    try {
      return await getRestaurantIdForUser(verifyAccessToken(accessToken));
    } catch (_error) {
      // token inválido: se trata como visitante anónimo
    }
  }
  throw new EntityError([{ field: "restaurant", message: "Indica el restaurante (?restaurant=slug)" }]);
};
