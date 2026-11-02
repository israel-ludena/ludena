import DropdownAvatar from "@/app/[locale]/manage/DropdownAvatar";
import MobileNavLinks from "@/app/[locale]/manage/MobileNavLinks";
import NavLinks from "@/app/[locale]/manage/NavLinks";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='bg-muted/40 flex min-h-screen w-full flex-col'>
      <NavLinks />
      <div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-14'>
        <header className='bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'>
          <MobileNavLinks />
          <div className='relative ml-auto flex-1 md:grow-0'>
            <div className='flex justify-end'>
              <DarkModeToggle />
            </div>
          </div>
          <DropdownAvatar />
        </header>
        {children}
      </div>
    </div>
  );
}
