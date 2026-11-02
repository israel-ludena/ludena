import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DishTable from "@/app/[locale]/manage/dishes/DishTable";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import envConfig, { Locale } from "@/config";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "DishesPage",
  });

  const url = envConfig.NEXT_PUBLIC_URL + `/${resolvedParams.locale}/manage/dishes`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
    },
  };
}

export default async function DishesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "DishesPage",
  });

  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <DishTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
