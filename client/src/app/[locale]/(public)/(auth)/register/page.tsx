import RegisterForm from "@/app/[locale]/(public)/(auth)/register/RegisterForm";
import envConfig, { Locale } from "@/config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Register" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: envConfig.NEXT_PUBLIC_URL + `/${locale}/register` },
  };
}

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <div className='flex min-h-screen items-center justify-center py-8'>
      <RegisterForm />
    </div>
  );
}
