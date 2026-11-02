// Import the framework and instantiate it
import envConfig, { API_URL } from "@/config";
import { errorHandlerPlugin } from "@/plugins/errorHandler.plugins";
import validatorCompilerPlugin from "@/plugins/validatorCompiler.plugins";
import accountRoutes from "@/routes/account.route";
import authRoutes from "@/routes/auth.route";
import fastifyAuth from "@fastify/auth";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifySocketIO from "fastify-socket.io";
import Fastify from "fastify";
import cors from "@fastify/cors";
import path from "path";
import { createFolder } from "@/utils/helpers";
import mediaRoutes from "@/routes/media.route";
import staticRoutes from "@/routes/static.route";
import dishRoutes from "@/routes/dish.route";
import testRoutes from "@/routes/test.route";
import { initOwnerAccount } from "@/controllers/account.controller";
import tablesRoutes from "@/routes/table.route";
import guestRoutes from "@/routes/guest.route";
import orderRoutes from "@/routes/order.route";
import { socketPlugin } from "@/plugins/socket.plugins";
import indicatorRoutes from "@/routes/indicator.route";
import autoRemoveRefreshTokenJob from "@/jobs/autoRemoveRefreshToken.job";

const fastify = Fastify({
  logger: {
    level: envConfig.PRODUCTION ? "info" : "debug",
  },
});

// Run the server!
const start = async () => {
  try {
    createFolder(path.resolve(envConfig.UPLOAD_FOLDER));
    autoRemoveRefreshTokenJob();
    const whitelist = ["*"];
    fastify.register(cors, {
      origin: whitelist, // Allow all origins for simplicity, adjust in production
      credentials: true,
    });

    fastify.register(fastifyAuth, {
      defaultRelation: "and",
    });
    fastify.register(fastifyHelmet, {
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },
    });
    fastify.register(fastifyCookie);
    fastify.register(validatorCompilerPlugin);
    fastify.register(errorHandlerPlugin);
    fastify.register(fastifySocketIO, {
      path: "/socket.io/",
      cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      allowEIO3: true, // Backward compatibility
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6,
      connectTimeout: 45000,
    });
    fastify.register(socketPlugin);
    fastify.register(authRoutes, {
      prefix: "/auth",
    });
    fastify.register(accountRoutes, {
      prefix: "/accounts",
    });
    fastify.register(mediaRoutes, {
      prefix: "/media",
    });
    fastify.register(staticRoutes, {
      prefix: "/static",
    });
    fastify.register(dishRoutes, {
      prefix: "/dishes",
    });
    fastify.register(tablesRoutes, {
      prefix: "/tables",
    });
    fastify.register(orderRoutes, {
      prefix: "/orders",
    });
    fastify.register(testRoutes, {
      prefix: "/test",
    });
    fastify.register(guestRoutes, {
      prefix: "/guest",
    });
    fastify.register(indicatorRoutes, {
      prefix: "/indicators",
    });

    // Health check endpoint for Docker
    fastify.get("/", async () => {
      return { status: "ok", message: "QRMeal API is running" };
    });

    await initOwnerAccount();
    await fastify.listen({
      port: envConfig.PORT,
      host: "0.0.0.0", // Always use 0.0.0.0 in production/container environment
    });
    console.log(`Server đang chạy dưới local tại: ${API_URL}`);
    if (envConfig.PRODUCTION) {
      console.log(`Đang ở mode production với domain: ${envConfig.PRODUCTION_URL}`);
    }
  } catch (err) {
    console.error("\nServer startup failed:");
    console.error(err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start().catch((err) => {
  console.error("\nUnhandled error during startup:");
  console.error(err);
  process.exit(1);
});
