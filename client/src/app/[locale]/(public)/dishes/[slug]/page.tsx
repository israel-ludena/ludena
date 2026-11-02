import dishApiRequest from "@/apiRequests/dish";
import DishDetail from "@/app/[locale]/(public)/dishes/[slug]/DishDetail";
import envConfig, { Locale } from "@/config";
import { htmlToTextForDescription } from "@/lib/server-utils";
import { generateSlugUrl, getIdFromSlugUrl, wrapServerApi } from "@/lib/utils";
import { baseOpenGraph } from "@/shared-metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

// Force dynamic rendering to avoid build-time data fetching issues
export const dynamic = "force-dynamic";

const getDetail = cache((id: number) => wrapServerApi(() => dishApiRequest.getDish(id)));

type Props = {
  params: Promise<{ slug: string; locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams: _searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "DishDetail",
  });
  const id = getIdFromSlugUrl(resolvedParams.slug);
  const data = await getDetail(id);
  const dish = data?.payload.data;
  if (!dish) {
    return {
      title: t("notFound"),
      description: t("notFound"),
    };
  }
  const url =
    envConfig.NEXT_PUBLIC_URL +
    `/${resolvedParams.locale}/dishes/${generateSlugUrl({
      name: dish.name,
      id: dish.id,
    })}`;

  return {
    title: dish.name,
    description: htmlToTextForDescription(dish.description),
    openGraph: {
      ...baseOpenGraph,
      title: dish.name,
      description: dish.description,
      url,
      images: [
        {
          url: dish.image,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function DishPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const id = getIdFromSlugUrl(slug);
  const data = await getDetail(id);

  const dish = data?.payload?.data;
  return <DishDetail dish={dish} />;
}
