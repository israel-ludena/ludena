import LoginForm from "@/app/[locale]/(public)/(auth)/login/LoginForm";
import Logout from "@/app/[locale]/(public)/(auth)/login/logout";
import envConfig, { Locale } from "@/config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Login" });
  const url = envConfig.NEXT_PUBLIC_URL + `/${locale}/login`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
    },
  };
}

export default function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <LoginForm />
      <Logout />
    </div>
  );
}
