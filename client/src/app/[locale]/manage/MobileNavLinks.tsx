/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import menuItems from "@/app/[locale]/manage/menuItems";
import { useAppStore } from "@/components/AppProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Package2, PanelLeft } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function MobileNavLinks() {
  const tMenu = useTranslations("Menu");
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size='icon' variant='outline' className='sm:hidden'>
          <PanelLeft className='h-5 w-5' />
          <span className='sr-only'>Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='sm:max-w-xs'>
        <nav className='grid gap-6 text-lg font-medium'>
          <Link
            href='/'
            className='group bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold md:text-base'
          >
            <Package2 className='h-5 w-5 transition-all group-hover:scale-110' />
            <span className='sr-only'>Acme Inc</span>
          </Link>
          {menuItems.map((Item, index) => {
            const isActive = pathname === Item.href;
            if (!role || !Item.roles.includes(role as any)) return null;
            return (
              <Link
                key={index}
                href={Item.href}
                className={cn("hover:text-foreground flex items-center gap-4 px-2.5", {
                  "text-foreground": isActive,
                  "text-muted-foreground": !isActive,
                })}
              >
                <Item.Icon className='h-5 w-5' />
                {tMenu(Item.title)}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
