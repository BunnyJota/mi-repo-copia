import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ClipboardList, Users, Scissors, BarChart3 } from "lucide-react";
import type { DashboardTab } from "@/pages/dashboard/Dashboard";
import { useI18n } from "@/i18n";

interface DashboardNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const navItems = [
  { id: "overview" as const, labelKey: "menu.overview", icon: LayoutDashboard },
  { id: "agenda" as const, labelKey: "menu.agenda", icon: Calendar },
  { id: "appointments" as const, labelKey: "menu.appointments", icon: ClipboardList },
  { id: "services" as const, labelKey: "menu.services", icon: Scissors },
  { id: "staff" as const, labelKey: "menu.staff", icon: Users },
  { id: "reports" as const, labelKey: "menu.reports", icon: BarChart3 },
];

export function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="grid h-16 grid-cols-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t(item.labelKey as any)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
