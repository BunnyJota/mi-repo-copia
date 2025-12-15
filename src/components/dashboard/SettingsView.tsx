import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Users, 
  Scissors, 
  Clock, 
  CreditCard, 
  Bell,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { BarbershopSettingsDialog } from "./settings/BarbershopSettingsDialog";
import { HoursSettingsDialog } from "./settings/HoursSettingsDialog";
import { NotificationsSettingsDialog } from "./settings/NotificationsSettingsDialog";

import type { DashboardTab } from "@/pages/dashboard/Dashboard";

interface SettingsViewProps {
  onTabChange?: (tab: DashboardTab) => void;
}

export function SettingsView({ onTabChange }: SettingsViewProps) {
  const { barbershop, subscription, trialDaysRemaining } = useUserData();
  const [barbershopDialogOpen, setBarbershopDialogOpen] = useState(false);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);

  const handleSettingClick = (id: string) => {
    switch (id) {
      case "barbershop":
        setBarbershopDialogOpen(true);
        break;
      case "staff":
        onTabChange?.("staff");
        break;
      case "services":
        onTabChange?.("services");
        break;
      case "hours":
        setHoursDialogOpen(true);
        break;
      case "notifications":
        setNotificationsDialogOpen(true);
        break;
    }
  };

  const settingsItems = [
    { id: "barbershop", icon: Store, label: "Mi barbería", description: "Nombre, logo, contacto" },
    { id: "staff", icon: Users, label: "Barberos", description: "Gestiona tu equipo" },
    { id: "services", icon: Scissors, label: "Servicios", description: "Precios y duración" },
    { id: "hours", icon: Clock, label: "Horarios", description: "Días y horas de apertura" },
    { id: "notifications", icon: Bell, label: "Notificaciones", description: "Recordatorios por email" },
  ];

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    if (subscription.status === "trial" && trialDaysRemaining !== null) {
      return <Badge variant="trial">Trial: {trialDaysRemaining} días restantes</Badge>;
    }
    if (subscription.status === "active") {
      return <Badge variant="default">Activo</Badge>;
    }
    if (subscription.status === "past_due") {
      return <Badge variant="destructive">Pago pendiente</Badge>;
    }
    return null;
  };

  const publicUrl = barbershop?.slug 
    ? `${window.location.origin}/b/${barbershop.slug}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground">Gestiona tu barbería</p>
      </div>

      {/* Subscription card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-display font-semibold">Suscripción</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Plan Profesional
              </p>
              <div className="mt-2">
                {getSubscriptionBadge()}
              </div>
            </div>
            {subscription?.status === "trial" && (
              <Button variant="default" size="sm">
                Activar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSettingClick(item.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Public page link */}
      {publicUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tu página de reservas</p>
                <p className="text-sm text-muted-foreground break-all">
                  {publicUrl}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
                <Link to={`/b/${barbershop.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Reportes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50">
              <span>Ingresos por período</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50">
              <span>Ingresos por barbero</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50">
              <span>Ingresos por servicio</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BarbershopSettingsDialog 
        open={barbershopDialogOpen} 
        onOpenChange={setBarbershopDialogOpen} 
      />
      <HoursSettingsDialog 
        open={hoursDialogOpen} 
        onOpenChange={setHoursDialogOpen} 
      />
      <NotificationsSettingsDialog 
        open={notificationsDialogOpen} 
        onOpenChange={setNotificationsDialogOpen} 
      />
    </div>
  );
}
