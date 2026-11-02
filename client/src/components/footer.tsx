import { Link } from "@/i18n/navigation";
import { Beef } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const brandT = useTranslations("Brand");

  return (
    <footer className='text-muted-foreground w-full border-t p-4 md:p-8'>
      <div className='flex flex-col items-center justify-between gap-4 md:flex-row md:gap-0'>
        <div className='flex flex-col items-center gap-2 md:flex-row md:gap-4'>
          <Link href='/' className='flex items-center gap-2' prefetch={false}>
            <Beef className='hover:text-foreground h-6 w-6' />
            <span className='text-sm font-medium'>{brandT("title")}</span>
          </Link>
          <div className='flex flex-col items-center gap-4 text-sm sm:flex-row'>
            <Link href='/term-of-service' className='hover:underline' prefetch={false}>
              {t("termOfService")}
            </Link>
            <Link href='/privacy-policy' className='hover:underline' prefetch={false}>
              {t("privacyPolicy")}
            </Link>
            <Link href='/about' className='hover:underline' prefetch={false}>
              {t("about")}
            </Link>
          </div>
        </div>
        {/* Redes sociales: se configurarán por restaurante */}
      </div>
    </footer>
  );
}
