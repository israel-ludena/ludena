import MenuOrder from "@/app/[locale]/guest/menu/MenuOrder";
import envConfig, { Locale } from "@/config";
import { baseOpenGraph } from "@/shared-metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams: _searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "GuestMenu",
  });

  const url = envConfig.NEXT_PUBLIC_URL + `/${resolvedParams.locale}/guest/menu`;

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      ...baseOpenGraph,
      title: t("title"),
      description: t("description"),
      url,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  };
}

export default async function MenuPage() {
  return (
    <div className='mx-auto max-w-[400px] space-y-4'>
      <h1 className='text-center text-xl font-bold'>🍕 Menu</h1>
      <MenuOrder />
    </div>
  );
}
