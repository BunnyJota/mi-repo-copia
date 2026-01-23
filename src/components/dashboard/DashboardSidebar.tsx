import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  Users, 
  Scissors, 
  UserCog,
  Settings,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import type { DashboardTab } from "@/pages/dashboard/Dashboard";
import { useI18n } from "@/i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const mainNavItems = [
  { id: "overview" as const, labelKey: "menu.overview", icon: LayoutDashboard },
  { id: "agenda" as const, labelKey: "menu.agenda", icon: Calendar },
  { id: "appointments" as const, labelKey: "menu.appointments", icon: ClipboardList },
  { id: "clients" as const, labelKey: "menu.clients", icon: Users },
];

const managementNavItems = [
  { id: "services" as const, labelKey: "menu.services", icon: Scissors },
  { id: "staff" as const, labelKey: "menu.staff", icon: UserCog },
  { id: "reports" as const, labelKey: "menu.reports", icon: BarChart3 },
];

const settingsNavItems = [
  { id: "settings" as const, labelKey: "menu.settings", icon: Settings },
];

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { barbershop } = useUserData();
  const { t } = useI18n();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("menu.group.main" as any)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={t(item.labelKey as any)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey as any)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("menu.group.management" as any)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={t(item.labelKey as any)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey as any)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("menu.group.system" as any)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={t(item.labelKey as any)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey as any)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {barbershop?.slug && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("menu.publicPage" as any)}>
                <Link
                  to={`/b/${barbershop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{t("menu.publicPage" as any)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
