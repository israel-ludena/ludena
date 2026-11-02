import { TokenPayload } from "@/types/jwt.types";
import type { Server } from "socket.io";
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
  }
  interface FastifyRequest {
    decodedAccessToken?: TokenPayload;
    /** Restaurante del usuario autenticado (cuenta o comensal). Lo fija requireLoginedHook. */
    restaurantId?: number;
  }
}
