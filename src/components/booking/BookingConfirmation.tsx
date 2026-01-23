import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, User, Scissors, Mail } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type {
  SelectedService,
  SelectedBarber,
  SelectedDateTime,
  ClientData,
} from "@/pages/booking/PublicBooking";
import { useI18n } from "@/i18n";
import { formatCurrency } from "@/lib/utils";
import type { PublicBarbershop } from "@/hooks/usePublicBooking";

interface BookingConfirmationProps {
  barbershopName: string;
  barbershop?: PublicBarbershop | null;
  clientData: ClientData;
  selectedServices: SelectedService[];
  selectedBarber: SelectedBarber | null;
  selectedDateTime: SelectedDateTime | null;
  totalPrice: number;
}

export function BookingConfirmation({
  barbershopName,
  barbershop,
  clientData,
  selectedServices,
  selectedBarber,
  selectedDateTime,
  totalPrice,
}: BookingConfirmationProps) {
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const { t, lang } = useI18n();
  const locale = lang === "en" ? enUS : es;

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {t("booking.confirmed" as any)}
        </h1>
        {barbershop?.id === "demo-barbershop-id" ? (
          <p className="mt-2 text-muted-foreground">
            {t("booking.confirmation.demoPrefix" as any)}{" "}
            <span className="font-medium text-foreground">{clientData.email}</span>
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            {t("booking.sentTo" as any)}{" "}
            <span className="font-medium text-foreground">{clientData.email}</span>
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 border-b pb-4 text-left">
            <p className="text-sm text-muted-foreground">{t("booking.at" as any)}</p>
            <p className="font-display font-semibold text-foreground">{barbershopName}</p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {selectedDateTime &&
                    format(
                      selectedDateTime.date,
                      lang === "en" ? "EEEE, MMMM d, yyyy" : "EEEE d 'de' MMMM 'de' yyyy",
                      { locale }
                    )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDateTime?.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{selectedBarber?.name}</p>
                <p className="text-sm text-muted-foreground">{t("booking.barber" as any)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scissors className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {selectedServices.map((s) => s.name).join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">{t("booking.services" as any)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {t("booking.confirmation.durationMinutes" as any).replace(
                    "{minutes}",
                    String(totalDuration),
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{t("booking.duration" as any)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("booking.totalToPay" as any)}</span>
                <span className="font-display text-xl font-bold text-primary">
                  {formatCurrency(totalPrice, barbershop?.currency || "USD", lang)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("booking.payOnSite" as any)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{t("booking.checkEmail" as any)}</span>
        </div>

        <Button variant="outline" size="lg" className="w-full" asChild>
          <a href="/">{t("booking.backHome" as any)}</a>
        </Button>
      </div>
    </div>
  );
}
