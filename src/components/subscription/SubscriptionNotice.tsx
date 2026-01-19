import { AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserData } from "@/hooks/useUserData";
import type { DashboardTab } from "@/pages/dashboard/Dashboard";

interface SubscriptionNoticeProps {
  onTabChange?: (tab: DashboardTab) => void;
}

export function SubscriptionNotice({ onTabChange }: SubscriptionNoticeProps) {
  const { subscription, subscriptionAccess } = useUserData();

  if (!subscription || (!subscriptionAccess.isPaymentRequired && !subscriptionAccess.isTrialEndingToday)) {
    return null;
  }

  const title = subscriptionAccess.isPaymentRequired
    ? "Tu prueba gratuita terminó"
    : "Tu prueba gratuita termina hoy";
  const description = subscriptionAccess.isPaymentRequired
    ? "Tu cuenta quedó limitada. Para continuar usando la plataforma debes pagar la suscripción mensual."
    : "Realiza el pago hoy para evitar la suspensión de funciones.";
  const buttonLabel = "Pagar suscripción mensual";

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-warning/20">
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          onClick={() => onTabChange?.("settings")}
          className="gap-2"
          variant="default"
        >
          <CreditCard className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
