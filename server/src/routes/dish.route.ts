import { createDish, deleteDish, getDishDetail, getDishList, updateDish } from "@/controllers/dish.controller";
import {
  getRequestRestaurantId,
  pauseApiHook,
  requireEmployeeHook,
  requireLoginedHook,
  requireOwnerHook,
  resolvePublicRestaurantId,
} from "@/hooks/auth.hooks";
import { RestaurantQuery, RestaurantQueryType } from "@/schemaValidations/common.schema";
import {
  CreateDishBody,
  CreateDishBodyType,
  DishListRes,
  DishListResType,
  DishParams,
  DishParamsType,
  DishRes,
  DishResType,
  UpdateDishBody,
  UpdateDishBodyType,
} from "@/schemaValidations/dish.schema";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function dishRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get<{
    Reply: DishListResType;
    Querystring: RestaurantQueryType;
  }>(
    "/",
    {
      schema: {
        querystring: RestaurantQuery,
        response: {
          200: DishListRes,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = await resolvePublicRestaurantId(request, request.query.restaurant);
      const dishs = await getDishList(restaurantId);
      reply.send({
        data: dishs as DishListResType["data"],
        message: "Lista de platos obtenida",
      });
    }
  );

  fastify.get<{
    Params: DishParamsType;
    Reply: DishResType;
    Querystring: RestaurantQueryType;
  }>(
    "/:id",
    {
      schema: {
        params: DishParams,
        querystring: RestaurantQuery,
        response: {
          200: DishRes,
        },
      },
    },
    async (request, reply) => {
      // El detalle de un plato es información pública; si llega el restaurante se valida que coincida
      const restaurantId = request.query.restaurant
        ? await resolvePublicRestaurantId(request, request.query.restaurant)
        : undefined;
      const dish = await getDishDetail(request.params.id, restaurantId);
      reply.send({
        data: dish as DishResType["data"],
        message: "Plato obtenido",
      });
    }
  );

  fastify.post<{
    Body: CreateDishBodyType;
    Reply: DishResType;
  }>(
    "",
    {
      schema: {
        body: CreateDishBody,
        response: {
          200: DishRes,
        },
      },
      // Login AND (Owner OR Employee)
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const dish = await createDish(getRequestRestaurantId(request), request.body);
      reply.send({
        data: dish as DishResType["data"],
        message: "Plato creado",
      });
    }
  );

  fastify.put<{
    Params: DishParamsType;
    Body: UpdateDishBodyType;
    Reply: DishResType;
  }>(
    "/:id",
    {
      schema: {
        params: DishParams,
        body: UpdateDishBody,
        response: {
          200: DishRes,
        },
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const dish = await updateDish(getRequestRestaurantId(request), request.params.id, request.body);
      reply.send({
        data: dish as DishResType["data"],
        message: "Plato actualizado",
      });
    }
  );

  fastify.delete<{
    Params: DishParamsType;
    Reply: DishResType;
  }>(
    "/:id",
    {
      schema: {
        params: DishParams,
        response: {
          200: DishRes,
        },
      },
      preValidation: fastify.auth([requireLoginedHook, pauseApiHook, [requireOwnerHook, requireEmployeeHook]], {
        relation: "and",
      }),
    },
    async (request, reply) => {
      const result = await deleteDish(getRequestRestaurantId(request), request.params.id);
      reply.send({
        message: "Plato eliminado",
        data: result as DishResType["data"],
      });
    }
  );
}
