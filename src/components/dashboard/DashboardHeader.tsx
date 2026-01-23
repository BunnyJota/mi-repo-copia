import { Button } from "@/components/ui/button";
import type { MouseEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  data: Record<string, any> | null;
}

interface DashboardHeaderProps {
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
}

export function DashboardHeader({ onSettingsClick, onNotificationsClick }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();
  const { profile, barbershop, subscription, trialDaysRemaining, subscriptionAccess, loading } = useUserData();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Fallback: usar evento personalizado
      window.dispatchEvent(new CustomEvent("navigate-to-settings"));
    }
  };

  const handleNotificationsClick = () => {
    if (onNotificationsClick) {
      onNotificationsClick();
    } else {
      window.dispatchEvent(new CustomEvent("open-notifications-dialog"));
    }
  };

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<NotificationItem[]> => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("id, title, body, created_at, read_at, data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return data || [];
    },
  });

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const clearNotifications = async () => {
    if (!user?.id) return;
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error clearing notifications:", error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const handleClearNotifications = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    clearNotifications();
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const locale = lang === "en" ? "en-US" : "es-ES";
      return new Date(dateString).toLocaleString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    if (subscription.status === "trial" && trialDaysRemaining !== null) {
      return (
        <Badge variant="trial" className="text-xs">
          {t("dashboard.subscription.trialPrefix" as any)} {trialDaysRemaining}{" "}
          {t("dashboard.subscription.days" as any)}
        </Badge>
      );
    }
    
    if (subscription.status === "active") {
      return <Badge variant="active" className="text-xs">{t("dashboard.subscription.active" as any)}</Badge>;
    }
    
    if (subscriptionAccess.isPaymentRequired) {
      return <Badge variant="pastdue" className="text-xs">{t("dashboard.subscription.paymentRequired" as any)}</Badge>;
    }
    
    return null;
  };

  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-base font-semibold sm:text-lg">
            {loading ? t("dashboard.loading" as any) : barbershop?.name || t("dashboard.myBarbershop" as any)}
          </h1>
        </div>
        {getSubscriptionBadge()}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-start justify-between gap-3 px-2 py-1.5">
              <div>
                <p className="text-sm font-medium">{t("dashboard.notifications.title" as any)}</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? t("dashboard.notifications.unreadCount" as any).replace("{count}", String(unreadCount))
                    : t("dashboard.notifications.noneNew" as any)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={notifications.length === 0}
                onClick={handleClearNotifications}
              >
                {t("dashboard.notifications.clear" as any)}
              </Button>
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                {t("dashboard.notifications.empty" as any)}
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 py-2"
                  onSelect={() => {
                    if (!notification.read_at) {
                      markNotificationRead(notification.id);
                    }
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimestamp(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{notification.body}</p>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                handleNotificationsClick();
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t("dashboard.notifications.configure" as any)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                  {getInitials(profile?.display_name || null)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.display_name || t("dashboard.user.fallback" as any)}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.user.roleOwner" as any)}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t("dashboard.menu.profile" as any)}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                handleSettingsClick();
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t("dashboard.menu.settings" as any)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("dashboard.menu.signOut" as any)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
