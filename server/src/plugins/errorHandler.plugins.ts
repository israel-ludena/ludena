import { AuthError, EntityError, ForbiddenError, StatusError, isPrismaClientKnownRequestError } from "@/utils/errors";
import { Prisma } from "@prisma/client";
import { FastifyError } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { ZodError } from "zod";

type ZodFastifyError = FastifyError & ZodError;

const isZodFastifyError = (error: unknown): error is ZodFastifyError => {
  if (error instanceof ZodError) {
    return true;
  }
  return false;
};

const isEntityError = (error: unknown): error is EntityError => {
  if (error instanceof EntityError) {
    return true;
  }
  return false;
};

const isAuthError = (error: unknown): error is AuthError => {
  if (error instanceof AuthError) {
    return true;
  }
  return false;
};

const isForbiddenError = (error: unknown): error is ForbiddenError => {
  if (error instanceof ForbiddenError) {
    return true;
  }
  return false;
};

const isStatusError = (error: unknown): error is StatusError => {
  if (error instanceof StatusError) {
    return true;
  }
  return false;
};

export const errorHandlerPlugin = fastifyPlugin(async (fastify) => {
  fastify.setErrorHandler(function (
    error:
      | EntityError
      | AuthError
      | ForbiddenError
      | FastifyError
      | ZodFastifyError
      | Prisma.PrismaClientKnownRequestError,
    request,
    reply
  ) {
    if (isEntityError(error)) {
      return reply.status(error.status).send({
        message: "Lỗi xảy ra khi xác thực dữ liệu...",
        errors: error.fields,
        statusCode: error.status,
      });
    } else if (isForbiddenError(error)) {
      return reply.status(error.status).send({
        message: error.message,
        statusCode: error.status,
      });
    } else if (isAuthError(error)) {
      return reply
        .setCookie("session_token", "", {
          path: "/",
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .status(error.status)
        .send({
          message: error.message,
          statusCode: error.status,
        });
    } else if (isStatusError(error)) {
      return reply.status(error.status).send({
        message: error.message,
        statusCode: error.status,
      });
    } else if (isZodFastifyError(error)) {
      const { issues, validationContext } = error;
      const errors = issues.map((issue) => {
        return {
          ...issue,
          field: issue.path.join("."),
        };
      });
      const statusCode = 422;
      return reply.status(statusCode).send({
        // validationContext will be 'body' or 'params' or 'headers' or 'query'
        message: `A validation error occurred when validating the ${validationContext}...`,
        errors,
        code: error.code,
        statusCode,
      });
    } else if (isPrismaClientKnownRequestError(error) && error.code === "P2025") {
      const statusCode = 404;
      return reply.status(statusCode).send({
        message: error.message ?? "Không tìm thấy dữ liệu",
        statusCode: statusCode,
      });
    } else {
      const statusCode = (error as { statusCode?: number }).statusCode || 400;
      return reply.status(statusCode).send({
        message: error.message,
        error,
        statusCode,
      });
    }
  });
});
