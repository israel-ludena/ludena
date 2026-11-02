import { formatCurrency } from "@/lib/utils";
import { DishResType } from "@/schemaValidations/dish.schema";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function DishDetail({ dish }: { dish: DishResType["data"] | undefined }) {
  const t = await getTranslations("DishDetail");
  if (!dish)
    return (
      <div>
        <h1 className='text-2xl font-semibold lg:text-3xl'>{t("notFound")}</h1>
      </div>
    );
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-semibold lg:text-3xl'>{dish.name}</h1>
      <div className='font-semibold'>Giá: {formatCurrency(dish.price)}</div>
      <Image
        src={dish.image}
        width={700}
        height={700}
        quality={100}
        alt={dish.name}
        className='h-full max-h-[1080px] w-full max-w-[1080px] rounded-md object-cover'
        title={dish.name}
      />
      <p>{dish.description}</p>
    </div>
  );
}
