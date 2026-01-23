import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  User,
  Clock,
  Plus
} from "lucide-react";
import { format, addDays, subDays, isSameDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/useAppointments";
import { useAvailabilityRules, getHoursFromRules } from "@/hooks/useAvailabilityRules";
import { useUserData } from "@/hooks/useUserData";
import { useI18n } from "@/i18n";
import { toast } from "sonner";

export function AgendaView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments(selectedDate);
  const { data: availabilityRules, isLoading: rulesLoading } = useAvailabilityRules();
  const { barbershop } = useUserData();
  const { t } = useI18n();

  const goToPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const handleAddAppointment = () => {
    if (barbershop?.slug) {
      window.open(`/b/${barbershop.slug}`, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error(t("agenda.addAppointmentMissingBarbershop" as any));
  };

  const isToday = isSameDay(selectedDate, new Date());
  const isLoading = appointmentsLoading || rulesLoading;

  // Get hours for the selected day based on availability rules
  const dayOfWeek = getDay(selectedDate);
  const hours = availabilityRules?.length 
    ? getHoursFromRules(availabilityRules, dayOfWeek)
    : ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // Check if barbershop is closed this day
  const dayRule = availabilityRules?.find((r) => r.day_of_week === dayOfWeek);
  const isClosed = dayRule ? !dayRule.is_enabled : false;

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goToPrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Hoy
            </Button>
          )}
        </div>
        <div className="text-right">
          <h2 className="font-display text-lg font-semibold">
            {format(selectedDate, "EEEE", { locale: es })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Day view */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex min-h-[80px]">
                  <div className="flex w-16 shrink-0 items-start justify-end border-r p-2">
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <div className="flex-1 p-2">
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isClosed ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="font-medium">Cerrado</p>
              <p className="text-sm">Este día no hay disponibilidad</p>
            </div>
          ) : hours.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No hay horarios configurados para este día</p>
            </div>
          ) : (
            <div className="divide-y">
              {hours.map((hour) => {
                const hourAppointments = (appointments || []).filter(
                  (apt) => format(new Date(apt.start_at), "HH:00") === hour
                );

                return (
                  <div key={hour} className="flex min-h-[80px]">
                    {/* Time column */}
                    <div className="flex w-16 shrink-0 items-start justify-end border-r p-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {hour}
                      </span>
                    </div>

                    {/* Appointments column */}
                    <div className="flex-1 p-2">
                      {hourAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {hourAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className={cn(
                                "rounded-lg border p-3 transition-colors hover:bg-muted/50",
                                apt.status === "confirmed"
                                  ? "border-l-4 border-l-success bg-success/5"
                                  : apt.status === "pending"
                                  ? "border-l-4 border-l-warning bg-warning/5"
                                  : "border-l-4 border-l-muted"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium truncate">
                                      {apt.client.name}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {apt.services.map((s) => s.name).join(", ")}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(apt.start_at), "HH:mm")} - {format(new Date(apt.end_at), "HH:mm")}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {apt.staff?.display_name || "Sin asignar"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          className="flex h-full w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                          onClick={handleAddAppointment}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Añadir cita
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating action button (mobile) */}
      <Button
        variant="hero"
        size="icon-lg"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden"
        onClick={handleAddAppointment}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
