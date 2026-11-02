"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { useLogoutMutation } from "@/queries/useAuth";
import { handleErrorApi } from "@/lib/utils";
import { toast } from "sonner";
import { useAccountMe } from "@/queries/useAccount";
import { useAppStore } from "@/components/AppProvider";
import { useTranslations } from "next-intl";

export default function DropdownAvatar() {
  const t = useTranslations("settings");
  const toast_t = useTranslations("toast");
  const logoutMutation = useLogoutMutation();
  const setRole = useAppStore((state) => state.setRole);
  const disconnectSocket = useAppStore((state) => state.disconnectSocket);
  const router = useRouter();
  const { data } = useAccountMe();
  const account = data?.payload.data;
  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      toast.success(toast_t("logoutSuccess"));
      setRole();
      disconnectSocket();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      handleErrorApi({ error, fallbackErrorMessage: toast_t("somethingWentWrong") });
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='overflow-hidden rounded-full'>
          <Avatar>
            <AvatarImage src={account?.avatar ?? undefined} alt={account?.name} />
            <AvatarFallback>{account?.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>{account?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={"/manage/setting"} className='cursor-pointer'>
            {t("setting")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={"/about"} className='cursor-pointer'>
            {t("help")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>{t("logout")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
