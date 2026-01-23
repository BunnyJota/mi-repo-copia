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
import { LanguageToggle, useI18n } from "@/i18n";
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
  const { t, lang } = useI18n();
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

  useEffect(() => {
    const pendingOpen = sessionStorage.getItem("open-barbershop-dialog");
    if (pendingOpen) {
      sessionStorage.removeItem("open-barbershop-dialog");
      setBarbershopDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => setNotificationsDialogOpen(true);
    window.addEventListener("open-notifications-dialog", handler);
    return () => window.removeEventListener("open-notifications-dialog", handler);
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
    { id: "barbershop", icon: Store, labelKey: "settings.item.barbershop.title", descriptionKey: "settings.item.barbershop.description" },
    { id: "staff", icon: Users, labelKey: "settings.item.staff.title", descriptionKey: "settings.item.staff.description" },
    { id: "services", icon: Scissors, labelKey: "settings.item.services.title", descriptionKey: "settings.item.services.description" },
    { id: "hours", icon: Clock, labelKey: "settings.item.hours.title", descriptionKey: "settings.item.hours.description" },
    { id: "notifications", icon: Bell, labelKey: "settings.item.notifications.title", descriptionKey: "settings.item.notifications.description" },
  ];

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    if (subscription.status === "trial" && trialDaysRemaining !== null) {
      return (
        <Badge variant="trial">
          {t("settings.subscription.badge.trialPrefix" as any)} {trialDaysRemaining}{" "}
          {t("settings.subscription.badge.daysRemaining" as any)}
        </Badge>
      );
    }
    if (subscription.status === "active") {
      return <Badge variant="default">{t("settings.subscription.badge.active" as any)}</Badge>;
    }
    if (subscriptionAccess.isPaymentRequired) {
      return <Badge variant="destructive">{t("settings.subscription.badge.paymentRequired" as any)}</Badge>;
    }
    if (subscription.status === "canceled") {
      return <Badge variant="outline">{t("settings.subscription.badge.canceled" as any)}</Badge>;
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
      const locale = lang === "en" ? "en-US" : "es-ES";
      return new Date(dateString).toLocaleDateString(locale, {
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
      const locale = lang === "en" ? "en-US" : "es-ES";
      return new Date(dateString).toLocaleDateString(locale, {
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
          {t("settings.title" as any)}
        </h1>
        <p className="text-muted-foreground">{t("settings.subtitle" as any)}</p>
      </div>

      {/* Subscription card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-display font-semibold">{t("settings.subscription.title" as any)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.subscription.plan" as any)}
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
                        {t("settings.subscription.processing" as any)}
                      </>
                    ) : (
                      t("settings.subscription.payMonthly" as any)
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
                        {t("settings.subscription.processing" as any)}
                      </>
                    ) : (
                      t("settings.subscription.activate" as any)
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
                        {t("settings.subscription.canceling" as any)}
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        {t("settings.subscription.cancel" as any)}
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
                        {t("settings.subscription.processing" as any)}
                      </>
                    ) : (
                      t("settings.subscription.reactivate" as any)
                    )}
                  </Button>
                )}
              </div>
            </div>
            {subscription?.status === "active" && subscription.current_period_end && (
              <div className="pt-3 border-t border-primary/10">
                <p className="text-sm font-medium text-foreground">
                  {t("settings.subscription.nextPaymentLabel" as any)}
                </p>
                <p className="mt-1 text-base font-semibold text-primary">
                  {formatDate(subscription.current_period_end)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("settings.subscription.nextPaymentDescription" as any)}
                </p>
              </div>
            )}
            {subscription?.status === "trial" && subscription.trial_ends_at && (
              <div className="pt-3 border-t border-primary/10">
                <p className="text-sm font-medium text-foreground">
                  {t("settings.subscription.trialEndLabel" as any)}
                </p>
                <p className="mt-1 text-base font-semibold text-primary">
                  {formatDate(subscription.trial_ends_at)}
                </p>
              </div>
            )}
            {subscriptionAccess.isTrialEndingToday && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                {t("settings.subscription.trialEndingTodayWarning" as any)}
              </div>
            )}
            {subscriptionAccess.isPaymentRequired && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t("settings.subscription.paymentRequiredWarning" as any)}
              </div>
            )}
            {subscription?.status === "canceled" && (
              <div className="pt-3 border-t border-primary/10">
                <p className="text-sm text-muted-foreground">
                  {t("settings.subscription.canceledInfoTitle" as any)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("settings.subscription.canceledInfoBody" as any)}
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
                  <p className="font-medium text-foreground">{t(item.labelKey as any)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(item.descriptionKey as any)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language selector */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium text-foreground">{t("settings.language.title" as any)}</p>
            <p className="text-sm text-muted-foreground">
              {t("settings.language.description" as any)}
            </p>
          </div>
          <LanguageToggle />
        </CardContent>
      </Card>

      {/* Public page link */}
        <Card>
          <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
                <p className="font-medium">{t("settings.publicPage.title" as any)}</p>
                <p className="text-sm text-muted-foreground break-all">
                {publicUrl ?? t("settings.publicPage.empty" as any)}
                </p>
              </div>
            {publicUrl ? (
              <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
                <Link to={`/b/${barbershop?.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  {t("settings.publicPage.open" as any)}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setBarbershopDialogOpen(true)}>
                {t("settings.publicPage.complete" as any)}
              </Button>
            )}
            </div>
          </CardContent>
        </Card>

      {/* Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("settings.reports.title" as any)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50">
              <span>{t("settings.reports.period" as any)}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50">
              <span>{t("settings.reports.barber" as any)}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50">
              <span>{t("settings.reports.service" as any)}</span>
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
            <AlertDialogTitle>{t("settings.cancel.title" as any)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.cancel.descriptionStart" as any)}{" "}
              ({subscription?.current_period_end ? formatDateShort(subscription.current_period_end) : t("settings.cancel.renewalFallback" as any)}).
              <br /><br />
              {t("settings.cancel.descriptionEnd" as any)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.cancel.keep" as any)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.cancel.confirm" as any)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
