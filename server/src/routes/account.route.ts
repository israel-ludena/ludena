import { Role } from "@/constants/type";
import {
  changePasswordController,
  createEmployeeAccount,
  createGuestController,
  deleteEmployeeAccount,
  getAccountList,
  getEmployeeAccount,
  getGuestList,
  getMeController,
  updateEmployeeAccount,
  updateMeController,
} from "@/controllers/account.controller";
import { pauseApiHook, requireEmployeeHook, requireLoginedHook, requireOwnerHook, getRequestRestaurantId } from "@/hooks/auth.hooks";
import {
  AccountIdParam,
  AccountIdParamType,
  AccountListRes,
  AccountListResType,
  AccountRes,
  AccountResType,
  ChangePasswordBody,
  ChangePasswordBodyType,
  CreateEmployeeAccountBody,
  CreateEmployeeAccountBodyType,
  CreateGuestBody,
  CreateGuestBodyType,
  CreateGuestRes,
  CreateGuestResType,
  GetGuestListQueryParams,
  GetGuestListQueryParamsType,
  GetListGuestsRes,
  GetListGuestsResType,
  UpdateEmployeeAccountBody,
  UpdateEmployeeAccountBodyType,
  UpdateMeBody,
  UpdateMeBodyType,
} from "@/schemaValidations/account.schema";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function accountRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.addHook("preValidation", fastify.auth([requireLoginedHook]));
  fastify.get<{ Reply: AccountListResType }>(
    "/",
    {
      schema: {
        response: {
          200: AccountListRes,
        },
      },
      preValidation: fastify.auth([requireOwnerHook]),
    },
    async (request, reply) => {
      const accounts = await getAccountList(getRequestRestaurantId(request));
      reply.send({
        data: accounts as AccountListResType["data"],
        message: "Lista del personal obtenida",
      });
    }
  );
  fastify.post<{
    Body: CreateEmployeeAccountBodyType;
    Reply: AccountResType;
  }>(
    "/",
    {
      schema: {
        response: {
          200: AccountRes,
        },
        body: CreateEmployeeAccountBody,
      },
      preValidation: fastify.auth([requireOwnerHook, pauseApiHook]),
    },
    async (request, reply) => {
      const account = await createEmployeeAccount(getRequestRestaurantId(request), request.body);
      reply.send({
        data: account as AccountResType["data"],
        message: "Cuenta creada",
      });
    }
  );
  fastify.get<{ Reply: AccountResType; Params: AccountIdParamType }>(
    "/detail/:id",
    {
      schema: {
        response: {
          200: AccountRes,
        },
        params: AccountIdParam,
      },
      preValidation: fastify.auth([requireOwnerHook]),
    },
    async (request, reply) => {
      const accountId = request.params.id;
      const account = await getEmployeeAccount(getRequestRestaurantId(request), accountId);
      reply.send({
        data: account as AccountResType["data"],
        message: "Empleado obtenido",
      });
    }
  );

  fastify.put<{ Reply: AccountResType; Params: AccountIdParamType; Body: UpdateEmployeeAccountBodyType }>(
    "/detail/:id",
    {
      schema: {
        response: {
          200: AccountRes,
        },
        params: AccountIdParam,
        body: UpdateEmployeeAccountBody,
      },
      preValidation: fastify.auth([requireOwnerHook, pauseApiHook]),
    },
    async (request, reply) => {
      const accountId = request.params.id;
      const body = request.body;
      const { account, socketId, isChangeRole } = await updateEmployeeAccount(getRequestRestaurantId(request), accountId, body);
      if (isChangeRole && socketId) {
        fastify.io.to(socketId).emit("refresh-token", account);
      }
      reply.send({
        data: account as AccountResType["data"],
        message: "Actualizado",
      });
    }
  );

  fastify.delete<{ Reply: AccountResType; Params: AccountIdParamType }>(
    "/detail/:id",
    {
      schema: {
        response: {
          200: AccountRes,
        },
        params: AccountIdParam,
      },
      preValidation: fastify.auth([requireOwnerHook, pauseApiHook]),
    },
    async (request, reply) => {
      const accountId = request.params.id;
      const { account, socketId } = await deleteEmployeeAccount(getRequestRestaurantId(request), accountId);
      if (socketId) {
        fastify.io.to(socketId).emit("logout", account);
      }
      reply.send({
        data: account as AccountResType["data"],
        message: "Eliminado",
      });
    }
  );

  fastify.get<{ Reply: AccountResType }>(
    "/me",
    {
      schema: {
        response: {
          200: AccountRes,
        },
      },
    },
    async (request, reply) => {
      const account = await getMeController(request.decodedAccessToken?.userId as number);
      reply.send({
        data: account as AccountResType["data"],
        message: "Información obtenida",
      });
    }
  );

  fastify.put<{
    Reply: AccountResType;
    Body: UpdateMeBodyType;
  }>(
    "/me",
    {
      schema: {
        response: {
          200: AccountRes,
        },
        body: UpdateMeBody,
      },
      preValidation: fastify.auth([pauseApiHook]),
    },
    async (request, reply) => {
      const result = await updateMeController(request.decodedAccessToken?.userId as number, request.body);
      reply.send({
        data: result as AccountResType["data"],
        message: "Información actualizada",
      });
    }
  );

  fastify.put<{
    Reply: AccountResType;
    Body: ChangePasswordBodyType;
  }>(
    "/change-password",
    {
      schema: {
        response: {
          200: AccountRes,
        },
        body: ChangePasswordBody,
      },
      preValidation: fastify.auth([pauseApiHook]),
    },
    async (request, reply) => {
      const result = await changePasswordController(request.decodedAccessToken?.userId as number, request.body);
      reply.send({
        data: result as AccountResType["data"],
        message: "Contraseña cambiada",
      });
    }
  );

  fastify.post<{ Reply: CreateGuestResType; Body: CreateGuestBodyType }>(
    "/guests",
    {
      schema: {
        response: {
          200: CreateGuestRes,
        },
        body: CreateGuestBody,
      },
      preValidation: fastify.auth([requireOwnerHook, requireEmployeeHook], {
        relation: "or",
      }),
    },
    async (request, reply) => {
      const result = await createGuestController(getRequestRestaurantId(request), request.body);
      reply.send({
        message: "Cliente creado",
        data: { ...result, role: Role.Guest } as CreateGuestResType["data"],
      });
    }
  );
  fastify.get<{ Reply: GetListGuestsResType; Querystring: GetGuestListQueryParamsType }>(
    "/guests",
    {
      schema: {
        response: {
          200: GetListGuestsRes,
        },
        querystring: GetGuestListQueryParams,
      },
      preValidation: fastify.auth([requireOwnerHook, requireEmployeeHook], {
        relation: "or",
      }),
    },
    async (request, reply) => {
      const result = await getGuestList(getRequestRestaurantId(request), {
        fromDate: request.query.fromDate,
        toDate: request.query.toDate,
      });
      reply.send({
        message: "Lista de clientes obtenida",
        data: result as GetListGuestsResType["data"],
      });
    }
  );
}
