"use client";

import { useAppStore } from "@/components/AppProvider";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/constants/type";
import { formatCurrency, getVietnameseOrderStatus } from "@/lib/utils";
import { useGuestGetOrderListQuery } from "@/queries/useGuest";
import { PayGuestOrdersResType, UpdateOrderResType } from "@/schemaValidations/order.schema";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect } from "react";
import { toast } from "sonner";

export default function OrdersCart() {
  const t = useTranslations("GuestOrders");
  const toast_t = useTranslations("toast");
  const socket = useAppStore((state) => state.socket);
  const { data, refetch } = useGuestGetOrderListQuery();
  const orders = data?.payload.data ?? [];
  const { waitingForPaying, paid } = orders.reduce(
    (result, order) => {
      if (
        order.status === OrderStatus.Delivered ||
        order.status === OrderStatus.Processing ||
        order.status === OrderStatus.Pending
      ) {
        return {
          ...result,
          waitingForPaying: {
            price: result.waitingForPaying.price + order.dishSnapshot.price * order.quantity,
            quantity: result.waitingForPaying.quantity + order.quantity,
          },
        };
      }
      if (order.status === OrderStatus.Paid) {
        return {
          ...result,
          paid: {
            price: result.paid.price + order.dishSnapshot.price * order.quantity,
            quantity: result.paid.quantity + order.quantity,
          },
        };
      }
      return result;
    },
    {
      waitingForPaying: {
        price: 0,
        quantity: 0,
      },
      paid: {
        price: 0,
        quantity: 0,
      },
    }
  );
  useEffect(() => {
    if (socket?.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("Connected to server with ID:", socket?.id);
    }

    function onDisconnect() {
      console.log("Disconnected from server");
    }

    function onUpdateOrder(data: UpdateOrderResType["data"]) {
      console.log("Order updated:", data);
      const {
        dishSnapshot: { name },
        quantity,
      } = data;
      toast(
        toast_t("orderUpdated", {
          dishName: name,
          quantity: quantity,
          status: getVietnameseOrderStatus(data.status),
        })
      );
      refetch();
    }

    function onPayment(data: PayGuestOrdersResType["data"]) {
      toast(toast_t("paymentSuccess", { orderCount: data.length }));
      refetch();
    }

    socket?.on("update-order", onUpdateOrder);
    socket?.on("payment", onPayment);

    socket?.on("connect", onConnect);
    socket?.on("disconnect", onDisconnect);

    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("update-order", onUpdateOrder);
      socket?.off("payment", onPayment);
    };
  }, [refetch, socket, toast_t]);
  return (
    <>
      {orders.map((order, index) => (
        <div key={order.id} className='flex gap-4'>
          <div className='text-xm font-semibold'>{index + 1}</div>
          <div className='relative flex-shrink-0'>
            <Image
              src={order.dishSnapshot.image}
              alt={order.dishSnapshot.name}
              height={100}
              width={100}
              quality={100}
              className='h-[80px] w-[80px] rounded-md object-cover'
            />
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm'>{order.dishSnapshot.name}</h3>
            <div className='text-xs font-semibold'>
              {formatCurrency(order.dishSnapshot.price)} x <Badge className='px-1'>{order.quantity}</Badge>
            </div>
          </div>
          <div className='ml-auto flex flex-shrink-0 items-center justify-center'>
            <Badge variant='outline'>{getVietnameseOrderStatus(order.status)}</Badge>
          </div>
        </div>
      ))}
      {paid.quantity !== 0 && (
        <div className='sticky bottom-0'>
          <div className='flex w-full justify-between space-x-4 text-xl font-semibold'>
            <span>
              {t("paidOrders")} · {paid.quantity} {t("item")}
            </span>
            <span>{formatCurrency(paid.price)}</span>
          </div>
        </div>
      )}
      <div className='sticky bottom-0'>
        <div className='flex w-full justify-between space-x-4 text-xl font-semibold'>
          <span>
            {t("unpaidOrders")} · {waitingForPaying.quantity} {t("item")}
          </span>
          <span>{formatCurrency(waitingForPaying.price)}</span>
        </div>
      </div>
    </>
  );
}
