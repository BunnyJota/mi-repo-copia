import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AgendaView } from "@/components/dashboard/AgendaView";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { ClientsList } from "@/components/dashboard/ClientsList";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { ServicesView } from "@/components/dashboard/ServicesView";
import { StaffView } from "@/components/dashboard/StaffView";
import { ReportsView } from "@/components/dashboard/ReportsView";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

export type DashboardTab = "overview" | "agenda" | "appointments" | "clients" | "services" | "staff" | "reports" | "settings";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const { subscriptionAccess, loading: userLoading } = useUserData();
  const { t } = useI18n();

  const handleTabChange = (tab: DashboardTab) => {
    const restrictedTabs: DashboardTab[] = ["agenda", "appointments", "clients", "services", "staff", "reports"];
    if (!userLoading && subscriptionAccess.isPaymentRequired && restrictedTabs.includes(tab)) {
      toast.error(t("dashboard.restriction.paymentRequired" as any));
      setActiveTab("settings");
      return;
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    const restrictedTabs: DashboardTab[] = ["agenda", "appointments", "clients", "services", "staff", "reports"];
    if (!userLoading && subscriptionAccess.isPaymentRequired && restrictedTabs.includes(activeTab)) {
      setActiveTab("settings");
    }
  }, [activeTab, subscriptionAccess.isPaymentRequired, userLoading]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview onTabChange={handleTabChange} />;
      case "agenda":
        return <AgendaView />;
      case "appointments":
        return <AppointmentsList />;
      case "clients":
        return <ClientsList />;
      case "services":
        return <ServicesView />;
      case "staff":
        return <StaffView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView onTabChange={handleTabChange} />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface-sunken">
        {/* Sidebar for desktop */}
        <DashboardSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        <SidebarInset className="flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="hidden md:flex" />
            <DashboardHeader
              onSettingsClick={() => handleTabChange("settings")}
              onNotificationsClick={() => {
                handleTabChange("settings");
                window.dispatchEvent(new CustomEvent("open-notifications-dialog"));
              }}
            />
          </header>
          
          {/* Main content */}
          <main className="flex-1 pb-20 md:pb-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="container py-4"
            >
              {renderContent()}
            </motion.div>
          </main>

          {/* Bottom nav for mobile */}
          <DashboardNav activeTab={activeTab} onTabChange={handleTabChange} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
