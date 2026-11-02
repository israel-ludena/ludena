import OrdersCart from "@/app/[locale]/guest/orders/OrdersCart";
import { useTranslations } from "next-intl";

export default function OrdersPage() {
  const t = useTranslations("GuestOrders");
  return (
    <div className='mx-auto max-w-[400px] space-y-4'>
      <h1 className='text-center text-xl font-bold'>{t("orders")}</h1>
      <OrdersCart />
    </div>
  );
}
