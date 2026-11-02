import { managerRoomOf, Role } from "@/constants/type";
import { getRestaurantIdForUser } from "@/hooks/auth.hooks";
import prisma from "@/database";
import { AuthError } from "@/utils/errors";
import { getChalk } from "@/utils/helpers";
import { verifyAccessToken } from "@/utils/jwt";
import fastifyPlugin from "fastify-plugin";

export const socketPlugin = fastifyPlugin(async (fastify) => {
  const chalk = await getChalk();

  fastify.io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth;

    if (!Authorization) {
      console.error(chalk.redBright("❌ No Authorization header"));
      return next(new AuthError("Autorización no válida"));
    }
    const accessToken = Authorization.split(" ")[1];
    try {
      const decodedAccessToken = verifyAccessToken(accessToken);
      const { userId, role } = decodedAccessToken;
      console.log(chalk.greenBright("✅ Token verified:"), { userId, role });

      if (role === Role.Guest) {
        await prisma.socket.upsert({
          where: {
            guestId: userId,
          },
          update: {
            socketId: socket.id,
          },
          create: {
            guestId: userId,
            socketId: socket.id,
          },
        });
      } else {
        await prisma.socket.upsert({
          where: {
            accountId: userId,
          },
          update: {
            socketId: socket.id,
          },
          create: {
            accountId: userId,
            socketId: socket.id,
          },
        });
        // Cada miembro del personal solo escucha los eventos de su restaurante
        socket.join(managerRoomOf(await getRestaurantIdForUser(decodedAccessToken)));
      }
      socket.handshake.auth.decodedAccessToken = decodedAccessToken;
    } catch (error: unknown) {
      console.error(chalk.redBright("❌ Socket auth error:"), error);
      return next(error as Error);
    }
    next();
  });
  fastify.io.on("connection", async (socket) => {
    console.log(chalk.cyanBright("🔌 Socket connected:", socket.id));
    socket.on("disconnect", async (_reason) => {
      console.log(chalk.redBright("🔌 Socket disconnected:", socket.id));
    });
  });
});
