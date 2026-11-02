/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import menuItems from "@/app/[locale]/manage/menuItems";
import { useAppStore } from "@/components/AppProvider";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Package2, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NavLinks() {
  const t = useTranslations("settings");
  const tMenu = useTranslations("Menu");
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);

  return (
    <TooltipProvider>
      <aside className='bg-background fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r sm:flex'>
        <nav className='flex flex-col items-center gap-4 px-2 py-4'>
          <Link
            href='/'
            className='group bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold md:h-8 md:w-8 md:text-base'
          >
            <Package2 className='h-4 w-4 transition-all group-hover:scale-110' />
            <span className='sr-only'>Acme Inc</span>
          </Link>

          {menuItems.map((Item, index) => {
            const isActive = pathname === Item.href;
            if (!role || !Item.roles.includes(role as any)) return null;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    href={Item.href}
                    className={cn(
                      "hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                      {
                        "bg-accent text-accent-foreground": isActive,
                        "text-muted-foreground": !isActive,
                      }
                    )}
                  >
                    <Item.Icon className='h-5 w-5' />
                    <span className='sr-only'>{tMenu(Item.title)}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side='right'>{tMenu(Item.title)}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <nav className='mt-auto flex flex-col items-center gap-4 px-2 py-4'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href='/manage/setting'
                className={cn(
                  "hover:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                  {
                    "bg-accent text-accent-foreground": pathname === "/manage/setting",
                    "text-muted-foreground": pathname !== "/manage/setting",
                  }
                )}
              >
                <Settings className='h-5 w-5' />
                <span className='sr-only'>Cài đặt</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side='right'>{t("setting")}</TooltipContent>
          </Tooltip>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
