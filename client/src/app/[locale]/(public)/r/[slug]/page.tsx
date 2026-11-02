export const dynamic = "force-dynamic";
import dishApiRequest from "@/apiRequests/dish";
import restaurantApiRequest from "@/apiRequests/restaurant";
import { RestaurantType } from "@/schemaValidations/restaurant.schema";
import { notFound } from "next/navigation";
import { formatCurrency, generateSlugUrl } from "@/lib/utils";
import { DishListResType } from "@/schemaValidations/dish.schema";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import envConfig, { Locale } from "@/config";
import { htmlToTextForDescription } from "@/lib/server-utils";

// Carta pública de un restaurante: /{locale}/r/{slug}
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const url = envConfig.NEXT_PUBLIC_URL + `/${locale}/r/${slug}`;
  let name = t("title");
  try {
    name = (await restaurantApiRequest.getBySlug(slug)).payload.data.name;
  } catch {
    // si no existe, la página mostrará 404
  }

  return {
    title: name,
    description: htmlToTextForDescription(t("description")),
    alternates: {
      canonical: url,
    },
  };
}

export default async function RestaurantMenu({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");
  let restaurant: RestaurantType;
  try {
    restaurant = (await restaurantApiRequest.getBySlug(slug)).payload.data;
  } catch {
    notFound();
  }
  let dishList: DishListResType["data"] = [];
  try {
    const result = await dishApiRequest.list(slug);
    const {
      payload: { data },
    } = result;
    dishList = data.filter((dish) => dish.status !== "Hidden");
  } catch (error) {
    console.error("No se pudieron cargar los platos:", error);
    return <div className='p-4 text-red-500'>{t("loadError")}</div>;
  }
  return (
    <div className='w-full space-y-4'>
      <section className='relative'>
        <span className='absolute top-0 left-0 z-10 h-full w-full bg-black opacity-50'></span>
        <Image
          src='/banner.png'
          width={400}
          height={200}
          quality={80}
          loading='lazy'
          alt='Banner'
          className='absolute top-0 left-0 h-full w-full object-cover'
        />
        <div className='relative z-10 px-4 py-10 text-white sm:px-10 md:px-20 md:py-20'>
          <h1 className='text-center text-xl font-bold sm:text-2xl md:text-4xl lg:text-5xl'>{restaurant.name}</h1>
          <p className='mt-4 text-center text-sm sm:text-base'>{t("slogan")}</p>
          {restaurant.address && <p className='mt-2 text-center text-xs sm:text-sm'>{restaurant.address}</p>}
        </div>
      </section>
      <section className='space-y-10 py-16'>
        <h2 className='text-center text-2xl font-bold'>{t("h2")}</h2>
        <div className='grid grid-cols-1 gap-10 sm:grid-cols-2'>
          {dishList.map((dish) => (
            <Link
              className='w flex gap-4'
              key={dish.id}
              href={`/dishes/${generateSlugUrl({
                name: dish.name,
                id: dish.id,
              })}`}
            >
              <div className='flex-shrink-0'>
                <Image
                  src={dish.image || "/150x150.svg"}
                  className='h-[150px] w-[150px] rounded-md object-cover'
                  alt={dish.name}
                  width={150}
                  height={150}
                  quality={80}
                  loading='lazy'
                />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold'>{dish.name}</h3>
                <p className=''>{dish.description}</p>
                <p className='font-semibold'>{formatCurrency(dish.price)}</p>
              </div>
            </Link>
          ))}
        </div>
        {dishList.length === 0 && <p className='text-muted-foreground text-center'>{t("emptyMenu")}</p>}
      </section>
    </div>
  );
}
