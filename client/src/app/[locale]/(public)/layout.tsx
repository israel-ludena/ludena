import { Link } from "@/i18n/navigation";
import { Menu, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import DarkModeToggle from "@/components/DarkModeToggle";
import SwitchLanguage from "@/components/SwitchLanguage";
import NavItems from "@/app/[locale]/(public)/NavItems";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function Layout({
  children,
  modal,
  params,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);
  return (
    <div className='relative flex min-h-screen w-full flex-col'>
      <header className='bg-background sticky top-0 z-20 flex h-16 items-center gap-4 border-b px-4 md:px-6'>
        <nav className='hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6'>
          <Link href='#' className='flex items-center gap-2 text-lg font-semibold md:text-base'>
            <Package2 className='h-6 w-6' />
            <span className='sr-only'>QR Meal</span>
          </Link>
          <NavItems className='text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors' />
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
              <Menu className='h-5 w-5' />
              <span className='sr-only'>Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left'>
            <nav className='grid gap-6 text-lg font-medium'>
              <Link href='#' className='flex items-center gap-2 text-lg font-semibold'>
                <Package2 className='h-6 w-6' />
                <span className='sr-only'>QR Meal</span>
              </Link>

              <NavItems className='text-muted-foreground hover:text-foreground transition-colors' />
            </nav>
          </SheetContent>
        </Sheet>
        <div className='ml-auto flex items-center gap-4'>
          <SwitchLanguage />
          <DarkModeToggle />
        </div>
      </header>
      <main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
        {children} {modal}
      </main>
    </div>
  );
}
