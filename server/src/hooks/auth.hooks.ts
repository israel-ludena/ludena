import { Role } from "@/constants/type";
import { AuthError } from "@/utils/errors";
import { verifyAccessToken } from "@/utils/jwt";
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
