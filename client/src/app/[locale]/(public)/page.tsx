import { Button } from "@/components/ui/button";
import envConfig, { Locale } from "@/config";
import { Link } from "@/i18n/navigation";
import { htmlToTextForDescription } from "@/lib/server-utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";

// Página de inicio del producto. La carta de cada restaurante vive en /r/{slug}.
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });
  return {
    title: t("title"),
    description: htmlToTextForDescription(t("description")),
    alternates: { canonical: envConfig.NEXT_PUBLIC_URL + `/${locale}` },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  const features = ["feature1", "feature2", "feature3", "feature4"] as const;

  return (
    <div className='w-full space-y-4'>
      <section className='relative'>
        <span className='absolute top-0 left-0 z-10 h-full w-full bg-black opacity-60'></span>
        <Image
          src='/banner.png'
          width={400}
          height={200}
          quality={80}
          priority
          alt=''
          className='absolute top-0 left-0 h-full w-full object-cover'
        />
        <div className='relative z-10 space-y-6 px-4 py-14 text-center text-white sm:px-10 md:px-20 md:py-24'>
          <h1 className='text-2xl font-bold sm:text-3xl md:text-5xl'>{t("heroTitle")}</h1>
          <p className='mx-auto max-w-2xl text-sm sm:text-base'>{t("description")}</p>
          <div className='flex flex-wrap justify-center gap-3'>
            <Button asChild size='lg'>
              <Link href='/register'>{t("ctaRegister")}</Link>
            </Button>
            <Button asChild size='lg' variant='secondary'>
              <Link href='/r/demo'>{t("ctaDemo")}</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className='grid gap-6 py-10 sm:grid-cols-2'>
        {features.map((key) => (
          <div key={key} className='rounded-lg border p-5'>
            <h2 className='text-lg font-semibold'>{t(`${key}Title`)}</h2>
            <p className='text-muted-foreground mt-1 text-sm'>{t(`${key}Text`)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
