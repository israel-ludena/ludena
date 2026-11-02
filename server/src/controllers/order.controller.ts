import { DishStatus, OrderStatus, TableStatus } from "@/constants/type";
import prisma from "@/database";
import { CreateOrdersBodyType, UpdateOrderBodyType } from "@/schemaValidations/order.schema";
import { Prisma } from "@prisma/client";

export const createOrdersController = async (
  restaurantId: number,
  orderHandlerId: number,
  body: CreateOrdersBodyType
) => {
  const { guestId, orders } = body;
  const guest = await prisma.guest.findFirstOrThrow({
    where: {
      id: guestId,
      restaurantId,
    },
  });
  if (guest.tableId === null) {
    throw new Error("La mesa de este cliente fue eliminada; elige otro cliente");
  }
  const table = await prisma.table.findUniqueOrThrow({
    where: {
      id: guest.tableId,
    },
  });
  if (table.status === TableStatus.Hidden) {
    throw new Error(`La mesa ${table.number} de este cliente está oculta; elige otro cliente`);
  }

  const [ordersRecord, socketRecord] = await Promise.all([
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ordersRecord = await Promise.all(
        orders.map(async (order) => {
          const dish = await tx.dish.findFirst({
            where: {
              id: order.dishId,
              restaurantId,
            },
          });
          if (!dish) throw new Error("El plato no existe en este restaurante");
          if (dish.status === DishStatus.Unavailable) {
            throw new Error(`El plato ${dish.name} está agotado`);
          }
          if (dish.status === DishStatus.Hidden) {
            throw new Error(`El plato ${dish.name} no se puede pedir`);
          }
          const dishSnapshot = await tx.dishSnapshot.create({
            data: {
              description: dish.description,
              image: dish.image,
              name: dish.name,
              price: dish.price,
              dishId: dish.id,
              status: dish.status,
            },
          });
          const orderRecord = await tx.order.create({
            data: {
              dishSnapshotId: dishSnapshot.id,
              guestId,
              quantity: order.quantity,
              restaurantId,
              tableId: table.id,
              tableNumber: table.number,
              orderHandlerId,
              status: OrderStatus.Pending,
            },
            include: {
              dishSnapshot: true,
              guest: true,
              orderHandler: true,
            },
          });
          type OrderRecord = typeof orderRecord;
          return orderRecord as OrderRecord & {
            status: (typeof OrderStatus)[keyof typeof OrderStatus];
            dishSnapshot: OrderRecord["dishSnapshot"] & {
              status: (typeof DishStatus)[keyof typeof DishStatus];
            };
          };
        })
      );
      return ordersRecord;
    }),
    prisma.socket.findUnique({
      where: {
        guestId: body.guestId,
      },
    }),
  ]);
  return {
    orders: ordersRecord,
    socketId: socketRecord?.socketId,
  };
};

export const getOrdersController = async (
  restaurantId: number,
  { fromDate, toDate }: { fromDate?: Date; toDate?: Date }
) => {
  const orders = await prisma.order.findMany({
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    where: {
      restaurantId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });
  return orders;
};

// Controller thanh toán các hóa đơn dựa trên guestId
export const payOrdersController = async (
  restaurantId: number,
  { guestId, orderHandlerId }: { guestId: number; orderHandlerId: number }
) => {
  const orders = await prisma.order.findMany({
    where: {
      guestId,
      restaurantId,
      status: {
        in: [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered],
      },
    },
  });
  if (orders.length === 0) {
    throw new Error("No hay cuentas por cobrar");
  }
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const orderIds = orders.map((order) => order.id);
    const updatedOrders = await tx.order.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: {
        status: OrderStatus.Paid,
        orderHandlerId,
      },
    });
    return updatedOrders;
  });
  const [ordersResult, sockerRecord] = await Promise.all([
    prisma.order.findMany({
      where: {
        id: {
          in: orders.map((order) => order.id),
        },
      },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.socket.findUnique({
      where: {
        guestId,
      },
    }),
  ]);
  return {
    orders: ordersResult,
    socketId: sockerRecord?.socketId,
  };
};

export const getOrderDetailController = (restaurantId: number, orderId: number) => {
  return prisma.order.findFirstOrThrow({
    where: {
      id: orderId,
      restaurantId,
    },
    include: {
      dishSnapshot: true,
      orderHandler: true,
      guest: true,
      table: true,
    },
  });
};

export const updateOrderController = async (
  restaurantId: number,
  orderId: number,
  body: UpdateOrderBodyType & { orderHandlerId: number }
) => {
  const { status, dishId, quantity, orderHandlerId } = body;
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findFirstOrThrow({
      where: {
        id: orderId,
        restaurantId,
      },
      include: {
        dishSnapshot: true,
      },
    });
    let dishSnapshotId = order.dishSnapshotId;
    if (order.dishSnapshot.dishId !== dishId) {
      const dish = await tx.dish.findFirst({
        where: {
          id: dishId,
          restaurantId,
        },
      });
      if (!dish) throw new Error("El plato no existe en este restaurante");
      const dishSnapshot = await tx.dishSnapshot.create({
        data: {
          description: dish.description,
          image: dish.image,
          name: dish.name,
          price: dish.price,
          dishId: dish.id,
          status: dish.status,
        },
      });
      dishSnapshotId = dishSnapshot.id;
    }
    const newOrder = await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        dishSnapshotId,
        quantity,
        orderHandlerId,
      },
      include: {
        dishSnapshot: true,
        orderHandler: true,
        guest: true,
      },
    });
    return newOrder;
  });
  const socketRecord = await prisma.socket.findUnique({
    where: {
      guestId: result.guestId!,
    },
  });
  return {
    order: result,
    socketId: socketRecord?.socketId,
  };
};
