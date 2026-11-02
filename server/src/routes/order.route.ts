import { managerRoomOf } from "@/constants/type";
import {
  createOrdersController,
  getOrderDetailController,
  getOrdersController,
  payOrdersController,
  updateOrderController,
} from "@/controllers/order.controller";
import { requireEmployeeHook, requireLoginedHook, requireOwnerHook, getRequestRestaurantId } from "@/hooks/auth.hooks";
import {
  CreateOrdersBody,
  CreateOrdersBodyType,
  CreateOrdersRes,
  CreateOrdersResType,
  GetOrderDetailRes,
  GetOrderDetailResType,
  GetOrdersQueryParams,
  GetOrdersQueryParamsType,
  GetOrdersRes,
  GetOrdersResType,
  OrderParam,
  OrderParamType,
  PayGuestOrdersBody,
  PayGuestOrdersBodyType,
  PayGuestOrdersRes,
  PayGuestOrdersResType,
  UpdateOrderBody,
  UpdateOrderBodyType,
  UpdateOrderRes,
  UpdateOrderResType,
} from "@/schemaValidations/order.schema";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function orderRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.addHook(
    "preValidation",
    fastify.auth([requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
      relation: "and",
    })
  );
  fastify.post<{ Reply: CreateOrdersResType; Body: CreateOrdersBodyType }>(
    "/",
    {
      schema: {
        response: {
          200: CreateOrdersRes,
        },
        body: CreateOrdersBody,
      },
    },
    async (request, reply) => {
      const restaurantId = getRequestRestaurantId(request);
      const room = managerRoomOf(restaurantId);
      const { socketId, orders } = await createOrdersController(
        restaurantId,
        request.decodedAccessToken?.userId as number,
        request.body
      );
      if (socketId) {
        fastify.io.to(room).to(socketId).emit("new-order", orders);
      } else {
        fastify.io.to(room).emit("new-order", orders);
      }
      reply.send({
        message: `Se crearon ${orders.length} pedidos para el cliente`,
        data: orders as CreateOrdersResType["data"],
      });
    }
  );
  fastify.get<{ Reply: GetOrdersResType; Querystring: GetOrdersQueryParamsType }>(
    "/",
    {
      schema: {
        response: {
          200: GetOrdersRes,
        },
        querystring: GetOrdersQueryParams,
      },
    },
    async (request, reply) => {
      const result = await getOrdersController(getRequestRestaurantId(request), {
        fromDate: request.query.fromDate,
        toDate: request.query.toDate,
      });
      reply.send({
        message: "Lista de pedidos obtenida",
        data: result as GetOrdersResType["data"],
      });
    }
  );

  fastify.get<{ Reply: GetOrderDetailResType; Params: OrderParamType }>(
    "/:orderId",
    {
      schema: {
        response: {
          200: GetOrderDetailRes,
        },
        params: OrderParam,
      },
    },
    async (request, reply) => {
      const result = await getOrderDetailController(getRequestRestaurantId(request), request.params.orderId);
      reply.send({
        message: "Pedido obtenido",
        data: result as GetOrderDetailResType["data"],
      });
    }
  );

  fastify.put<{ Reply: UpdateOrderResType; Body: UpdateOrderBodyType; Params: OrderParamType }>(
    "/:orderId",
    {
      schema: {
        response: {
          200: UpdateOrderRes,
        },
        body: UpdateOrderBody,
        params: OrderParam,
      },
    },
    async (request, reply) => {
      const restaurantId = getRequestRestaurantId(request);
      const room = managerRoomOf(restaurantId);
      const result = await updateOrderController(restaurantId, request.params.orderId, {
        ...request.body,
        orderHandlerId: request.decodedAccessToken?.userId as number,
      });
      if (result.socketId) {
        fastify.io.to(result.socketId).to(room).emit("update-order", result.order);
      } else {
        fastify.io.to(room).emit("update-order", result.order);
      }
      reply.send({
        message: "Pedido actualizado",
        data: result.order as UpdateOrderResType["data"],
      });
    }
  );

  fastify.post<{ Body: PayGuestOrdersBodyType; Reply: PayGuestOrdersResType }>(
    "/pay",
    {
      schema: {
        response: {
          200: PayGuestOrdersRes,
        },
        body: PayGuestOrdersBody,
      },
    },
    async (request, reply) => {
      const restaurantId = getRequestRestaurantId(request);
      const room = managerRoomOf(restaurantId);
      const result = await payOrdersController(restaurantId, {
        guestId: request.body.guestId,
        orderHandlerId: request.decodedAccessToken?.userId as number,
      });
      if (result.socketId) {
        fastify.io.to(result.socketId).to(room).emit("payment", result.orders);
      } else {
        fastify.io.to(room).emit("payment", result.orders);
      }
      reply.send({
        message: `Se cobraron ${result.orders.length} pedidos`,
        data: result.orders as PayGuestOrdersResType["data"],
      });
    }
  );
}
