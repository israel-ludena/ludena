import {
  getMyRestaurantController,
  getRestaurantBySlugController,
  registerRestaurantController,
  updateMyRestaurantController,
} from "@/controllers/restaurant.controller";
import { getRequestRestaurantId, requireLoginedHook, requireOwnerHook } from "@/hooks/auth.hooks";
import {
  PublicRestaurantRes,
  PublicRestaurantResType,
  RegisterRestaurantBody,
  RegisterRestaurantBodyType,
  RestaurantRes,
  RestaurantResType,
  RestaurantSlugParams,
  RestaurantSlugParamsType,
  UpdateRestaurantBody,
  UpdateRestaurantBodyType,
} from "@/schemaValidations/restaurant.schema";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function restaurantRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // Registro público: crea el restaurante y la cuenta del dueño
  fastify.post<{ Body: RegisterRestaurantBodyType; Reply: RestaurantResType }>(
    "/register",
    {
      schema: { body: RegisterRestaurantBody, response: { 200: RestaurantRes } },
    },
    async (request, reply) => {
      const restaurant = await registerRestaurantController(request.body);
      reply.send({ data: restaurant, message: "Restaurante creado. Ya puedes iniciar sesión." });
    }
  );

  // Restaurante del usuario autenticado
  fastify.get<{ Reply: RestaurantResType }>(
    "/me",
    {
      schema: { response: { 200: RestaurantRes } },
      preValidation: fastify.auth([requireLoginedHook]),
    },
    async (request, reply) => {
      const restaurant = await getMyRestaurantController(getRequestRestaurantId(request));
      reply.send({ data: restaurant, message: "Restaurante obtenido" });
    }
  );

  fastify.put<{ Body: UpdateRestaurantBodyType; Reply: RestaurantResType }>(
    "/me",
    {
      schema: { body: UpdateRestaurantBody, response: { 200: RestaurantRes } },
      preValidation: fastify.auth([requireLoginedHook, requireOwnerHook]),
    },
    async (request, reply) => {
      const restaurant = await updateMyRestaurantController(getRequestRestaurantId(request), request.body);
      reply.send({ data: restaurant, message: "Restaurante actualizado" });
    }
  );

  // Datos públicos para la carta: /restaurants/{slug}
  fastify.get<{ Params: RestaurantSlugParamsType; Reply: PublicRestaurantResType }>(
    "/:slug",
    {
      schema: { params: RestaurantSlugParams, response: { 200: PublicRestaurantRes } },
    },
    async (request, reply) => {
      const restaurant = await getRestaurantBySlugController(request.params.slug);
      reply.send({ data: restaurant, message: "Restaurante obtenido" });
    }
  );
}
