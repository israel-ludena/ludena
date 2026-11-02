import envConfig from "@/config";
import { OrderStatus } from "@/constants/type";
import prisma from "@/database";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma } from "@prisma/client";

export const dashboardIndicatorController = async ({ fromDate, toDate }: { fromDate: Date; toDate: Date }) => {
  const [orders, guests, dishes] = await Promise.all([
    prisma.order.findMany({
      include: {
        dishSnapshot: true,
        table: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    }),
    prisma.guest.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
        orders: {
          some: {
            status: OrderStatus.Paid,
          },
        },
      },
    }),
    prisma.dish.findMany(),
  ]);

  // Doanh thu
  let revenue = 0;
  // Số lượng khách gọi món thành công
  const guestCount = guests.length;
  // Số lượng đơn
  const orderCount = orders.length;
  // Thống kê món ăn
  const dishIndicatorObj: Record<
    number,
    {
      id: number;
      name: string;
      price: number;
      description: string;
      image: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      successOrders: number; // Số lượng đã đặt thành công
    }
  > = dishes.reduce(
    (
      acc: Record<
        number,
        {
          id: number;
          name: string;
          price: number;
          image: string;
          description: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
          successOrders: number;
        }
      >,
      dish: Prisma.DishGetPayload<Record<string, never>>
    ) => {
      acc[dish.id] = { ...dish, successOrders: 0 };
      return acc;
    },
    {} as Record<
      number,
      {
        id: number;
        name: string;
        price: number;
        image: string;
        description: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        successOrders: number;
      }
    >
  );
  // Doanh thu theo ngày
  // Tạo object revenueByDateObj với key là ngày từ fromDate -> toDate và value là doanh thu
  const revenueByDateObj: { [key: string]: number } = {};

  // Lặp từ fromDate -> toDate
  for (let i = fromDate; i <= toDate; i.setDate(i.getDate() + 1)) {
    revenueByDateObj[formatInTimeZone(i, envConfig.SERVER_TIMEZONE, "dd/MM/yyyy")] = 0;
  }

  // Số lượng bàn đang được sử dụng
  const tableNumberObj: { [key: number]: boolean } = {};
  orders.forEach((order: Prisma.OrderGetPayload<{ include: { dishSnapshot: true; table: true } }>) => {
    if (order.status === OrderStatus.Paid) {
      revenue += order.dishSnapshot.price * order.quantity;
      if (order.dishSnapshot.dishId && dishIndicatorObj[order.dishSnapshot.dishId]) {
        dishIndicatorObj[order.dishSnapshot.dishId].successOrders++;
      }
      const date = formatInTimeZone(order.createdAt, envConfig.SERVER_TIMEZONE, "dd/MM/yyyy");
      revenueByDateObj[date] = (revenueByDateObj[date] ?? 0) + order.dishSnapshot.price * order.quantity;
    }
    if (
      [OrderStatus.Processing, OrderStatus.Pending, OrderStatus.Delivered].includes(
        order.status as typeof OrderStatus.Processing
      ) &&
      order.tableNumber !== null
    ) {
      tableNumberObj[order.tableNumber] = true;
    }
  });
  // Số lượng bàn đang sử dụng
  const servingTableCount = Object.keys(tableNumberObj).length;

  // Doanh thu theo ngày
  const revenueByDate = Object.keys(revenueByDateObj).map((date) => {
    return {
      date,
      revenue: revenueByDateObj[date],
    };
  });
  const dishIndicator = Object.values(dishIndicatorObj);
  return {
    revenue,
    guestCount,
    orderCount,
    servingTableCount,
    dishIndicator,
    revenueByDate,
  };
};
