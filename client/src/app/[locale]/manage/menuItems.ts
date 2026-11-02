import { Role } from "@/constants/type";
import { Home, ShoppingCart, Users2, Salad, Table } from "lucide-react";

const menuItems = [
  {
    title: "dashboard" as const,
    Icon: Home,
    href: "/manage/dashboard",
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: "orders" as const,
    Icon: ShoppingCart,
    href: "/manage/orders",
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: "tables" as const,
    Icon: Table,
    href: "/manage/tables",
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: "dishes" as const,
    Icon: Salad,
    href: "/manage/dishes",
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: "accounts" as const,
    Icon: Users2,
    href: "/manage/accounts",
    roles: [Role.Owner],
  },
] as const;

export default menuItems;
