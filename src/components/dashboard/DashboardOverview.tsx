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
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTodayAppointments, useAppointmentStats } from "@/hooks/useAppointments";
import { useUserData } from "@/hooks/useUserData";
import { useState } from "react";
import { toast } from "sonner";
import { getAppUrl } from "@/lib/utils";

export function DashboardOverview() {
  const { profile, barbershop, loading: userLoading } = useUserData();
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: stats, isLoading: statsLoading } = useAppointmentStats();
  const [copied, setCopied] = useState(false);

  const isLoading = userLoading || appointmentsLoading || statsLoading;
  
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

  // Get upcoming appointments (not completed/canceled)
  const upcomingAppointments = (todayAppointments || [])
    .filter((apt) => apt.status !== "completed" && apt.status !== "canceled")
    .slice(0, 4);

  const displayName = profile?.display_name?.split(" ")[0] || "Usuario";
  
  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

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
              <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                Completar configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
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
                <div>
                  <p className="text-sm text-muted-foreground">Citas hoy</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-2xl font-bold">{stats?.todayCount ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Esta semana</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-2xl font-bold">{stats?.weekCount ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos mes</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-2xl font-bold">
                      ${stats?.monthRevenue?.toFixed(0) ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Próximas citas</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {appointmentsLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map((i) => (
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
          ) : upcomingAppointments.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No hay citas programadas para hoy
            </div>
          ) : (
            <div className="divide-y">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {apt.client.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {apt.services.map((s) => s.name).join(", ")} • {apt.staff?.display_name || "Sin asignar"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(apt.start_at), "HH:mm")}
                    </div>
                    <Badge
                      variant={apt.status === "confirmed" ? "confirmed" : "pending"}
                    >
                      {apt.status === "confirmed" ? "Confirmada" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" size="lg" className="h-auto flex-col gap-2 py-4">
          <CalendarCheck className="h-6 w-6 text-primary" />
          <span>Nueva cita</span>
        </Button>
        <Button variant="outline" size="lg" className="h-auto flex-col gap-2 py-4">
          <User className="h-6 w-6 text-primary" />
          <span>Nuevo cliente</span>
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
