import { useEffect, useState } from "react";
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
import { useCreateSubscription, useCancelSubscription } from "@/hooks/useSubscription";
import { BarbershopSettingsDialog } from "./settings/BarbershopSettingsDialog";
import { HoursSettingsDialog } from "./settings/HoursSettingsDialog";
import { NotificationsSettingsDialog } from "./settings/NotificationsSettingsDialog";
import { getAppUrl } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { DashboardTab } from "@/pages/dashboard/Dashboard";

interface SettingsViewProps {
  onTabChange?: (tab: DashboardTab) => void;
}

export function SettingsView({ onTabChange }: SettingsViewProps) {
  const { barbershop, subscription, trialDaysRemaining, subscriptionAccess } = useUserData();
  const [barbershopDialogOpen, setBarbershopDialogOpen] = useState(false);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();

  useEffect(() => {
    const handler = () => setBarbershopDialogOpen(true);
    window.addEventListener("open-barbershop-dialog", handler);
    return () => window.removeEventListener("open-barbershop-dialog", handler);
  }, []);

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
    if (subscriptionAccess.isPaymentRequired) {
      return <Badge variant="destructive">Pago requerido</Badge>;
    }
    if (subscription.status === "canceled") {
      return <Badge variant="outline">Cancelado</Badge>;
    }
    return null;
  };

  const handleActivateSubscription = () => {
    createSubscription.mutate();
  };

  const handleCancelSubscription = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancelSubscription = () => {
    cancelSubscription.mutate();
    setCancelDialogOpen(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const publicUrl = barbershop?.slug 
    ? `${getAppUrl()}/b/${barbershop.slug}`
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
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-display font-semibold">Suscripción</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan Profesional - $10 USD/mes (pago mensual recurrente)
                </p>
                <div className="mt-2">
                  {getSubscriptionBadge()}
                </div>
              </div>
              <div className="ml-4 flex gap-2">
                {subscriptionAccess.isPaymentRequired && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleActivateSubscription}
                    disabled={createSubscription.isPending}
                  >
                    {createSubscription.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Pagar suscripción mensual"
                    )}
                  </Button>
                )}
                {subscription?.status === "trial" && !subscriptionAccess.isPaymentRequired && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleActivateSubscription}
                    disabled={createSubscription.isPending}
                  >
                    {createSubscription.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Activar"
                    )}
                  </Button>
                )}
                {subscription?.status === "active" && !subscriptionAccess.isPaymentRequired && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscription.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {cancelSubscription.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Cancelar suscripción
                      </>
                    )}
                  </Button>
                )}
                {subscription?.status === "canceled" && !subscriptionAccess.isPaymentRequired && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleActivateSubscription}
                    disabled={createSubscription.isPending}
                  >
                    {createSubscription.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Reactivar"
                    )}
                  </Button>
                )}
              </div>
            </div>
            {subscription?.status === "active" && subscription.current_period_end && (
              <div className="pt-3 border-t border-primary/10">
                <p className="text-sm font-medium text-foreground">
                  Próxima fecha de pago
                </p>
                <p className="mt-1 text-base font-semibold text-primary">
                  {formatDate(subscription.current_period_end)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tu suscripción se renovará automáticamente cada mes en esta fecha. Puedes cancelar en cualquier momento.
                </p>
              </div>
            )}
            {subscription?.status === "trial" && subscription.trial_ends_at && (
              <div className="pt-3 border-t border-primary/10">
                <p className="text-sm font-medium text-foreground">
                  Fin del período de prueba
                </p>
                <p className="mt-1 text-base font-semibold text-primary">
                  {formatDate(subscription.trial_ends_at)}
                </p>
              </div>
            )}
            {subscriptionAccess.isTrialEndingToday && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                Tu prueba gratuita termina hoy. Realiza el pago para evitar la suspensión de funciones.
              </div>
            )}
            {subscriptionAccess.isPaymentRequired && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Tu prueba gratuita terminó y la cuenta quedó limitada. Solo puedes continuar pagando la suscripción.
              </div>
            )}
            {subscription?.status === "canceled" && (
              <div className="pt-3 border-t border-primary/10">
                <p className="text-sm text-muted-foreground">
                  Tu suscripción ha sido cancelada. No se realizarán más cargos automáticos.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Puedes reactivar tu suscripción en cualquier momento para continuar disfrutando del Plan Profesional.
                </p>
              </div>
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
        <Card>
          <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
                <p className="font-medium">Tu página de reservas</p>
                <p className="text-sm text-muted-foreground break-all">
                {publicUrl ?? "Configura tu barbería para generar el link público."}
                </p>
              </div>
            {publicUrl ? (
              <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
                <Link to={`/b/${barbershop?.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setBarbershopDialogOpen(true)}>
                Completar configuración
              </Button>
            )}
            </div>
          </CardContent>
        </Card>

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
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar tu suscripción? Tu acceso al Plan Profesional 
              continuará hasta el final del período de facturación actual ({subscription?.current_period_end ? formatDateShort(subscription.current_period_end) : "fecha de renovación"}).
              <br /><br />
              Después de esa fecha, no se realizarán más cargos y perderás el acceso a las funciones premium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar suscripción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
