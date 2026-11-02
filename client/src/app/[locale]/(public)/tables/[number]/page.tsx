import GuestLoginForm from "@/app/[locale]/(public)/tables/[number]/GuestLoginForm";
import envConfig, { Locale } from "@/config";
import { baseOpenGraph } from "@/shared-metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ number: string; locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams: _searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "LoginGuest",
  });

  const url = envConfig.NEXT_PUBLIC_URL + `/${resolvedParams.locale}/tables/${resolvedParams.number}`;

  return {
    title: `No ${resolvedParams.number} | ${t("title")}`,
    description: t("description"),
    openGraph: {
      ...baseOpenGraph,
      title: `No ${resolvedParams.number} | ${t("title")}`,
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

export default function TableNumberPage() {
  return <GuestLoginForm />;
}
