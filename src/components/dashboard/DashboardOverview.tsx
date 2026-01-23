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
import { format, isPast } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useAppointmentStats, useUpcomingAgendaAppointments, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useUserData } from "@/hooks/useUserData";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAppUrl, formatCurrency } from "@/lib/utils";
import { DashboardTab } from "@/pages/dashboard/Dashboard";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { SubscriptionNotice } from "@/components/subscription/SubscriptionNotice";

interface DashboardOverviewProps {
  onTabChange?: (tab: DashboardTab) => void;
}

export function DashboardOverview({ onTabChange }: DashboardOverviewProps) {
  const { profile, barbershop, loading: userLoading } = useUserData();
  const { lang, t } = useI18n();
  const queryClient = useQueryClient();
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingAgendaAppointments({
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
    limit: 15,
  });
  const { data: stats, isLoading: statsLoading } = useAppointmentStats();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const [copied, setCopied] = useState(false);

  // Only show loading if user data is loading, not if there's no barbershop
  const isLoading = userLoading || (upcomingLoading && barbershop?.id) || (statsLoading && barbershop?.id);
  
  // Build booking URL
  const bookingUrl = barbershop?.slug 
    ? `${getAppUrl()}/b/${barbershop.slug}`
    : null;

  const handleCopyLink = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success(t("dashboard.bookingLink.copied" as any));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t("dashboard.bookingLink.copyError" as any));
    }
  };

  const upcomingAppointments = upcomingData?.items || [];
  const upcomingTotal = upcomingData?.total || 0;
  const remainingCount = Math.max(upcomingTotal - upcomingAppointments.length, 0);

  const displayName = profile?.display_name?.split(" ")[0] || t("dashboard.user.fallback" as any);
  
  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.greeting.morning" as any)
      : hour < 18
      ? t("dashboard.greeting.afternoon" as any)
      : t("dashboard.greeting.evening" as any);

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
          queryClient.invalidateQueries({ queryKey: ["upcoming-agenda-appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershop?.id, queryClient]);

  const handleCompleteAppointment = async (appointmentId: string) => {
    if (updateAppointmentStatus.isPending) return;
    const confirm = window.confirm(t("dashboard.upcoming.confirmComplete" as any));
    if (!confirm) return;
    await updateAppointmentStatus.mutateAsync({ id: appointmentId, status: "completed" });
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: lang === "en" ? enUS : es })}
        </p>
      </div>

      <SubscriptionNotice onTabChange={onTabChange} />

      {/* Booking Link Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("dashboard.bookingLink.title" as any)}</h3>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.bookingLink.subtitle" as any)}
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
                {t("dashboard.bookingLink.empty" as any)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTabChange?.("settings");
                  window.dispatchEvent(new CustomEvent("open-barbershop-dialog"));
                }}
              >
                {t("dashboard.bookingLink.complete" as any)}
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
            <h3 className="text-lg font-semibold mb-2">{t("dashboard.setup.title" as any)}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("dashboard.setup.subtitle" as any)}
            </p>
            <Button
              onClick={() => {
                onTabChange?.("settings");
                window.dispatchEvent(new CustomEvent("open-barbershop-dialog"));
              }}
            >
              {t("dashboard.setup.complete" as any)}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("dashboard.stats.title" as any)}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["appointments"] });
                queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
                toast.success(t("dashboard.stats.updated" as any));
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("dashboard.stats.refresh" as any)}
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
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.todayAppointments" as any)}</p>
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
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.uniqueClients" as any)}</p>
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
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.todayRevenue" as any)}</p>
                    <p className="font-display text-2xl font-bold">
                      {formatCurrency(stats?.todayRevenue || 0, barbershop?.currency || "USD", lang)}
                    </p>
                    {stats?.todayPaidRevenue !== undefined && stats.todayPaidRevenue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stats.todayPaidRevenue, barbershop?.currency || "USD", lang)}{" "}
                        {t("dashboard.stats.paid" as any)}
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
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.pendingAppointments" as any)}</p>
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
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.thisWeek" as any)}</p>
                    <p className="font-display text-2xl font-bold">{stats?.weekCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.stats.scheduledAppointments" as any)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.monthRevenue" as any)}</p>
                    <p className="font-display text-2xl font-bold">
                      {formatCurrency(stats?.monthRevenue || 0, barbershop?.currency || "USD", lang)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.stats.completedAppointments" as any)}</p>
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
            <CardTitle className="text-lg">{t("dashboard.upcoming.title" as any)}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("dashboard.upcoming.autoRefresh" as any)}
            </p>
            {upcomingTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("dashboard.upcoming.showing" as any)
                  .replace("{shown}", String(upcomingAppointments.length))
                  .replace("{total}", String(upcomingTotal))}
                {remainingCount > 0
                  ? ` • ${t("dashboard.upcoming.remaining" as any).replace("{count}", String(remainingCount))}`
                  : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["appointments"] });
                queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
                queryClient.invalidateQueries({ queryKey: ["upcoming-agenda-appointments"] });
                toast.success(t("dashboard.upcoming.updated" as any));
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
              {t("dashboard.upcoming.viewAll" as any)}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {userLoading || (upcomingLoading && barbershop?.id) ? (
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
              <p className="font-medium">{t("dashboard.upcoming.setupTitle" as any)}</p>
              <p className="text-sm mt-1">{t("dashboard.upcoming.setupSubtitle" as any)}</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">{t("dashboard.upcoming.emptyTitle" as any)}</p>
              <p className="text-sm mt-1">{t("dashboard.upcoming.emptySubtitle" as any)}</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingAppointments.map((apt, index) => {
                const aptDate = new Date(apt.start_at);
                const isPastAppointment = isPast(aptDate);
                const isNext = index === 0;

                return (
                  <div
                    key={apt.id}
                    className={`
                      flex items-center gap-4 px-6 py-4 transition-colors
                      ${isNext ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/50"}
                      ${isPastAppointment ? "opacity-60" : ""}
                    `}
                  >
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-full
                      ${isNext ? "bg-primary/20" : "bg-muted"}
                    `}>
                      {isNext ? (
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
                        {isNext && (
                          <Badge variant="confirmed" className="text-xs">
                            {t("dashboard.upcoming.next" as any)}
                          </Badge>
                        )}
                        {isPastAppointment && (
                          <Badge variant="secondary" className="text-xs">
                            {t("dashboard.upcoming.late" as any)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {apt.services.map((s) => s.name).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {apt.staff?.display_name || t("dashboard.upcoming.unassigned" as any)}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs font-medium text-foreground">
                          {formatCurrency(apt.total_price_estimated, barbershop?.currency || "USD", lang)}
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
                        {apt.status === "confirmed"
                          ? t("dashboard.upcoming.statusConfirmed" as any)
                          : t("dashboard.upcoming.statusPending" as any)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => handleCompleteAppointment(apt.id)}
                        disabled={updateAppointmentStatus.isPending}
                      >
                        {t("dashboard.upcoming.complete" as any)}
                      </Button>
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
          <span>{t("dashboard.quickActions.agenda" as any)}</span>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="h-auto flex-col gap-2 py-4"
          onClick={() => onTabChange?.("clients")}
        >
          <Users className="h-6 w-6 text-primary" />
          <span>{t("dashboard.quickActions.clients" as any)}</span>
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
