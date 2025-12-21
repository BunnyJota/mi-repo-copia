import { useState } from "react";
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

export type DashboardTab = "overview" | "agenda" | "appointments" | "clients" | "services" | "staff" | "reports" | "settings";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview onTabChange={setActiveTab} />;
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
        return <SettingsView onTabChange={setActiveTab} />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface-sunken">
        {/* Sidebar for desktop */}
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <SidebarInset className="flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="hidden md:flex" />
            <DashboardHeader onSettingsClick={() => setActiveTab("settings")} />
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
          <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
