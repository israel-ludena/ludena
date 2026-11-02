"use client";

import { useAppStore } from "@/components/AppProvider";
import { Role } from "@/constants/type";
import { cn, handleErrorApi } from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { RoleType } from "@/types/jwt.types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const menuItems: {
  titleKey: "home" | "menu" | "orders" | "login" | "manage";
  href: string;
  role?: RoleType[];
  hideWhenLogin?: boolean;
}[] = [
  {
    titleKey: "home",
    href: "/",
  },
  {
    titleKey: "menu",
    href: "/guest/menu",
    role: [Role.Guest],
  },
  {
    titleKey: "orders",
    href: "/guest/orders",
    role: [Role.Guest],
  },
  {
    titleKey: "login",
    href: "/login",
    hideWhenLogin: true,
  },
  {
    titleKey: "manage",
    href: "/manage/dashboard",
    role: [Role.Owner, Role.Employee],
  },
];

export default function NavItems({ className }: { className?: string }) {
  const t = useTranslations("NavItem");
  const t1 = useTranslations("toast");
  const role = useAppStore((state) => state.role);
  const setRole = useAppStore((state) => state.setRole);
  const disconnectSocket = useAppStore((state) => state.disconnectSocket);
  const logoutMutation = useLogoutMutation();
  const router = useRouter();
  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logoutMutation.mutateAsync();
      toast.success(t1("logoutSuccess"));
      setRole();
      disconnectSocket();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      handleErrorApi({ error });
    }
  };
  return (
    <>
      {menuItems.map((item) => {
        const isAuth = item.role && role && item.role.includes(role);
        const canShow = (item.role === undefined && !item.hideWhenLogin) || (item.hideWhenLogin && !role);
        if (isAuth || canShow) {
          return (
            <Link href={item.href} key={item.href} className={className}>
              {t(item.titleKey)}
            </Link>
          );
        }
        return null;
      })}
      {role && (
        <AlertDialog>
          <AlertDialogTrigger>
            <div className={cn(className, "cursor-pointer")}>{t("logout")}</div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logoutDialog.logoutQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>{t("logoutDialog.logoutConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("logoutDialog.logoutCancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
