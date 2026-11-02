"use client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locales } from "@/config";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export default function SwitchLanguage() {
  const t = useTranslations("SwitchLanguage");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        const newPathname = pathname.replace(/^\/[a-z]{2}/, `/${value}`);
        router.replace(newPathname);
        router.refresh();
      }}
    >
      <SelectTrigger className='w-[140px]'>
        <SelectValue placeholder={t("title")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {locales.map((locale) => (
            <SelectItem value={locale} key={locale}>
              {t(locale)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
