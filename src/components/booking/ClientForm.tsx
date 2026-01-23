import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, User, Scissors, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type {
  SelectedService,
  SelectedBarber,
  SelectedDateTime,
  ClientData,
} from "@/pages/booking/PublicBooking";
import { formatCurrency } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { PublicBarbershop } from "@/hooks/usePublicBooking";

interface ClientFormProps {
  selectedServices: SelectedService[];
  selectedBarber: SelectedBarber | null;
  selectedDateTime: SelectedDateTime | null;
  totalPrice: number;
  barbershop?: PublicBarbershop | null;
  onConfirm: (data: ClientData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function ClientForm({
  selectedServices,
  selectedBarber,
  selectedDateTime,
  totalPrice,
  barbershop,
  onConfirm,
  onBack,
  isSubmitting = false,
}: ClientFormProps) {
  const { lang, t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("booking.client.errors.nameRequired" as any);
    }

    if (!email.trim()) {
      newErrors.email = t("booking.client.errors.emailRequired" as any);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("booking.client.errors.emailInvalid" as any);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      onConfirm({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
    }
  };

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {t("booking.client.title" as any)}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("booking.client.subtitle" as any)}
        </p>
      </div>

      {/* Booking summary */}
      <Card variant="accent">
        <CardContent className="p-4">
          <h2 className="mb-3 font-display font-semibold">{t("booking.summary.title" as any)}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Scissors className="h-4 w-4" />
              <span>
                {selectedServices.map((s) => s.name).join(", ")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{selectedBarber?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {selectedDateTime &&
                  format(selectedDateTime.date, "EEEE d 'de' MMMM", {
                    locale: lang === "en" ? enUS : es,
                  })}{" "}
                {t("booking.summary.atTime" as any).replace("{time}", selectedDateTime?.time || "")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t("booking.summary.durationMinutes" as any).replace("{minutes}", String(totalDuration))}</span>
            </div>
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("booking.totalToPay" as any)}</span>
                <span className="font-display text-lg font-bold text-primary">
                  {formatCurrency(totalPrice, barbershop?.currency || "USD", lang)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("booking.client.nameLabel" as any)}</Label>
          <Input
            id="name"
            placeholder={t("booking.client.namePlaceholder" as any)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? "border-destructive" : ""}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("booking.client.emailLabel" as any)}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("booking.client.emailPlaceholder" as any)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("booking.client.emailHelper" as any)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("booking.client.phoneLabel" as any)}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t("booking.client.phonePlaceholder" as any)}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t("common.back" as any)}
          </Button>
          <Button 
            type="submit" 
            variant="hero" 
            size="lg" 
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("booking.client.submitting" as any)}
              </>
            ) : (
              t("booking.confirmButton" as any)
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
