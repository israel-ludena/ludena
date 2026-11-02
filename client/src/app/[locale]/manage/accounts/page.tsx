import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AccountTable from "@/app/[locale]/manage/accounts/AccountTable";
import { Suspense } from "react";
import envConfig, { Locale } from "@/config";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "AccountsPage",
  });

  const url = envConfig.NEXT_PUBLIC_URL + `/${resolvedParams.locale}/manage/accounts`;

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

export default async function Dashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "AccountsPage",
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
            <Suspense fallback={<div>Loading...</div>}>
              <AccountTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
