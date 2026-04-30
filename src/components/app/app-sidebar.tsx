"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowRightLeftIcon,
  CalendarDaysIcon,
  ContactRoundIcon,
  FolderKanbanIcon,
  LandmarkIcon,
  MapPinnedIcon,
  ReceiptTextIcon,
  RepeatIcon,
  Settings2Icon,
  TagsIcon,
  WalletIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type SidebarUser = {
  email: string;
  firstName: string | null;
};

const navigationItems = [
  {
    href: "/wallets",
    label: "Wallets",
    icon: WalletIcon,
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ReceiptTextIcon,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: TagsIcon,
  },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDaysIcon,
  },
  {
    href: "/recurrences",
    label: "Recurrences",
    icon: RepeatIcon,
  },
  {
    href: "/models",
    label: "Models",
    icon: FolderKanbanIcon,
  },
  {
    href: "/transfers",
    label: "Transfers",
    icon: ArrowRightLeftIcon,
  },
  {
    href: "/debts",
    label: "Debts",
    icon: LandmarkIcon,
  },
  {
    href: "/places",
    label: "Places",
    icon: MapPinnedIcon,
  },
  {
    href: "/people",
    label: "People",
    icon: ContactRoundIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings2Icon,
  },
] as const;

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 px-3 py-4">
        <Link
          href="/wallets"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-sidebar-accent"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <WalletIcon className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Amin Wallet</p>
            <p className="truncate text-xs text-sidebar-foreground/70">Budget workspace</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/30 px-3 py-2">
          <UserButton />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.firstName ?? "Signed in"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
