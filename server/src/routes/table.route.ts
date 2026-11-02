import { createTable, deleteTable, getTableDetail, getTableList, updateTable } from "@/controllers/table.controller";
import {
  getRequestRestaurantId,
  pauseApiHook,
  requireEmployeeHook,
  requireLoginedHook,
  requireOwnerHook,
} from "@/hooks/auth.hooks";
import {
  CreateTableBody,
  CreateTableBodyType,
  TableListRes,
  TableListResType,
  TableParams,
  TableParamsType,
  TableRes,
  TableResType,
  UpdateTableBody,
  UpdateTableBodyType,
} from "@/schemaValidations/table.schema";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function tablesRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get<{
    Reply: TableListResType;
  }>(
    "/",
    {
      schema: {
        response: {
          200: TableListRes,
        },
      },
      preValidation: fastify.auth([requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const Tables = await getTableList(getRequestRestaurantId(request));
      reply.send({
        data: Tables as TableListResType["data"],
        message: "Lista de mesas obtenida",
      });
    }
  );

  fastify.get<{
    Params: TableParamsType;
    Reply: TableResType;
  }>(
    "/:number",
    {
      schema: {
        params: TableParams,
        response: {
          200: TableRes,
        },
      },
      preValidation: fastify.auth([requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const Table = await getTableDetail(getRequestRestaurantId(request), request.params.number);
      reply.send({
        data: Table as TableResType["data"],
        message: "Mesa obtenida",
      });
    }
  );

  fastify.post<{
    Body: CreateTableBodyType;
    Reply: TableResType;
  }>(
    "",
    {
      schema: {
        body: CreateTableBody,
        response: {
          200: TableRes,
        },
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const Table = await createTable(getRequestRestaurantId(request), request.body);
      reply.send({
        data: Table as TableResType["data"],
        message: "Mesa creada",
      });
    }
  );

  fastify.put<{
    Params: TableParamsType;
    Body: UpdateTableBodyType;
    Reply: TableResType;
  }>(
    "/:number",
    {
      schema: {
        params: TableParams,
        body: UpdateTableBody,
        response: {
          200: TableRes,
        },
      },
      preValidation: fastify.auth([pauseApiHook, requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const Table = await updateTable(getRequestRestaurantId(request), request.params.number, request.body);
      reply.send({
        data: Table as TableResType["data"],
        message: "Mesa actualizada",
      });
    }
  );

  fastify.delete<{
    Params: TableParamsType;
    Reply: TableResType;
  }>(
    "/:number",
    {
      schema: {
        params: TableParams,
        response: {
          200: TableRes,
        },
      },
      preValidation: fastify.auth([pauseApiHook, requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const result = await deleteTable(getRequestRestaurantId(request), request.params.number);
      reply.send({
        message: "Mesa eliminada",
        data: result as TableResType["data"],
      });
    }
  );
}
