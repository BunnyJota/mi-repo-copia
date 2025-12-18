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
  { id: "overview" as const, label: "Inicio", icon: LayoutDashboard },
  { id: "agenda" as const, label: "Agenda", icon: Calendar },
  { id: "appointments" as const, label: "Citas", icon: ClipboardList },
  { id: "clients" as const, label: "Clientes", icon: Users },
];

const managementNavItems = [
  { id: "services" as const, label: "Servicios", icon: Scissors },
  { id: "staff" as const, label: "Equipo", icon: UserCog },
  { id: "reports" as const, label: "Reportes", icon: BarChart3 },
];

const settingsNavItems = [
  { id: "settings" as const, label: "Configuración", icon: Settings },
];

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { barbershop } = useUserData();

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
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
              <SidebarMenuButton asChild tooltip="Ver página pública">
                <Link
                  to={`/b/${barbershop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Ver página pública</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
