import { useTranslations } from "next-intl";

export default function PrivacyPolicy() {
  const t = useTranslations("PrivacyPolicyPage");

  return (
    <div className='flex flex-col'>
      <section className='bg-secondary px-4 py-20 md:px-6 lg:px-8'>
        <div className='max-w-4xl text-center'>
          <h1 className='text-4xl font-bold sm:text-5xl md:text-6xl'>{t("title")}</h1>
        </div>
      </section>
      <section className='py-12 md:py-20 lg:py-24'>
        <div className='max-w-4xl space-y-8'>
          <div>
            <h2 className='text-3xl font-bold'>{t("dataCollection")}</h2>
            <p className='text-muted-foreground mt-4 leading-8'>{t("dataCollectionContent")}</p>
          </div>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold'>{t("dataUsage")}</h2>
            <p className='text-muted-foreground leading-8'>{t("dataUsageContent")}</p>
            <ul className='text-muted-foreground space-y-4 leading-8'>
              <li>{t("processOrders")}</li>
              <li>{t("customerService")}</li>
              <li>{t("marketing")}</li>
              <li>{t("serviceImprovement")}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
