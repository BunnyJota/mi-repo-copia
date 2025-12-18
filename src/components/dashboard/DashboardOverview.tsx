import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  CalendarCheck, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  User,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { useTodayAppointments, useAppointmentStats } from "@/hooks/useAppointments";
import { useUserData } from "@/hooks/useUserData";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { getAppUrl } from "@/lib/utils";
import { DashboardTab } from "@/pages/dashboard/Dashboard";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardOverviewProps {
  onTabChange?: (tab: DashboardTab) => void;
}

export function DashboardOverview({ onTabChange }: DashboardOverviewProps) {
  const { profile, barbershop, loading: userLoading } = useUserData();
  const queryClient = useQueryClient();
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments({
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
  });
  const { data: stats, isLoading: statsLoading } = useAppointmentStats();
  const [copied, setCopied] = useState(false);

  // Only show loading if user data is loading, not if there's no barbershop
  const isLoading = userLoading || (appointmentsLoading && barbershop?.id) || (statsLoading && barbershop?.id);
  
  // Build booking URL
  const bookingUrl = barbershop?.slug 
    ? `${getAppUrl()}/b/${barbershop.slug}`
    : null;

  const handleCopyLink = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Link copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar el link");
    }
  };

  // Get upcoming appointments (not completed/canceled, sorted by time)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return (todayAppointments || [])
      .filter((apt) => {
        const aptDate = new Date(apt.start_at);
        return apt.status !== "completed" && 
               apt.status !== "canceled" && 
               (isFuture(aptDate) || isToday(aptDate));
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 5);
  }, [todayAppointments]);

  const displayName = profile?.display_name?.split(" ")[0] || "Usuario";
  
  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  // Set up real-time subscription for appointments
  useEffect(() => {
    if (!barbershop?.id) return;

    const channel = supabase
      .channel(`appointments-${barbershop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "appointments",
          filter: `barbershop_id=eq.${barbershop.id}`,
        },
        (payload) => {
          // Invalidate queries when appointments change
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
          queryClient.invalidateQueries({ queryKey: ["reports"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershop?.id, queryClient]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Booking Link Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tu página de reservas</h3>
              <p className="text-sm text-muted-foreground">
                Comparte este link con tus clientes
              </p>
            </div>
          </div>
          {bookingUrl ? (
            <div className="flex gap-2">
              <Input 
                value={bookingUrl} 
                readOnly 
                className="bg-background font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(bookingUrl, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Configura tu barbería para generar el enlace público de reservas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTabChange?.("settings");
                  window.dispatchEvent(new CustomEvent("open-barbershop-dialog"));
                }}
              >
                Completar configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Stats - Main focus */}
      {!barbershop?.id && !userLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Configura tu barbería</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Completa la configuración inicial para ver estadísticas y gestionar citas.
            </p>
            <Button
              onClick={() => {
                onTabChange?.("settings");
                window.dispatchEvent(new CustomEvent("open-barbershop-dialog"));
              }}
            >
              Completar configuración
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Resumen del día</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["appointments"] });
                queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
                toast.success("Datos actualizados");
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {userLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <CalendarCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Citas hoy</p>
                    <p className="font-display text-2xl font-bold">{stats?.todayCount ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Clientes únicos</p>
                    <p className="font-display text-2xl font-bold">{stats?.uniqueClientsToday ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Ingresos del día</p>
                    <p className="font-display text-2xl font-bold">
                      ${stats?.todayRevenue?.toFixed(0) ?? 0}
                    </p>
                    {stats?.todayPaidRevenue !== undefined && stats.todayPaidRevenue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${stats.todayPaidRevenue.toFixed(0)} pagados
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                    <AlertCircle className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Citas pendientes</p>
                    <p className="font-display text-2xl font-bold">{stats?.pendingCount ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        </div>
      )}

      {/* Weekly and Monthly Stats */}
      {barbershop?.id && (
        <div className="grid gap-4 sm:grid-cols-2">
          {userLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Esta semana</p>
                    <p className="font-display text-2xl font-bold">{stats?.weekCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Citas programadas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Ingresos del mes</p>
                    <p className="font-display text-2xl font-bold">
                      ${stats?.monthRevenue?.toFixed(0) ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Citas completadas</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Upcoming appointments - Real-time updates */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Próximas citas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Se actualiza automáticamente cada 15 segundos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["appointments"] });
                queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
                toast.success("Citas actualizadas");
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => onTabChange?.("agenda")}
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {userLoading || (appointmentsLoading && barbershop?.id) ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : !barbershop?.id ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Configura tu barbería</p>
              <p className="text-sm mt-1">Completa la configuración para ver las citas</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">No hay citas programadas</p>
              <p className="text-sm mt-1">Las próximas citas aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingAppointments.map((apt) => {
                const aptDate = new Date(apt.start_at);
                const isPastAppointment = isPast(aptDate) && !isToday(aptDate);
                const isNow = isToday(aptDate) && Math.abs(new Date().getTime() - aptDate.getTime()) < 30 * 60 * 1000; // Within 30 minutes
                
                return (
                  <div
                    key={apt.id}
                    className={`
                      flex items-center gap-4 px-6 py-4 transition-colors
                      ${isNow ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/50"}
                      ${isPastAppointment ? "opacity-60" : ""}
                    `}
                  >
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-full
                      ${isNow ? "bg-primary/20" : "bg-muted"}
                    `}>
                      {isNow ? (
                        <Clock className="h-5 w-5 text-primary animate-pulse" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {apt.client.name}
                        </p>
                        {isNow && (
                          <Badge variant="confirmed" className="text-xs">
                            Ahora
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {apt.services.map((s) => s.name).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {apt.staff?.display_name || "Sin asignar"}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs font-medium text-foreground">
                          ${apt.total_price_estimated.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(aptDate, "HH:mm")}
                      </div>
                      <Badge
                        variant={
                          apt.status === "confirmed" 
                            ? "confirmed" 
                            : apt.status === "pending"
                            ? "pending"
                            : "pending"
                        }
                        className="text-xs"
                      >
                        {apt.status === "confirmed" ? "Confirmada" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="h-auto flex-col gap-2 py-4"
          onClick={() => onTabChange?.("agenda")}
        >
          <CalendarCheck className="h-6 w-6 text-primary" />
          <span>Ver agenda</span>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="h-auto flex-col gap-2 py-4"
          onClick={() => onTabChange?.("clients")}
        >
          <Users className="h-6 w-6 text-primary" />
          <span>Ver clientes</span>
        </Button>
      </div>
    </div>
  );
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}
