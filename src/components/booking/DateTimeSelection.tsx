import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { SelectedDateTime, SelectedBarber } from "@/pages/booking/PublicBooking";
import type { PublicBarbershop, PublicStaff } from "@/hooks/usePublicBooking";
import { useAvailableSlots } from "@/hooks/usePublicBooking";

interface DateTimeSelectionProps {
  barbershop: PublicBarbershop;
  staff: PublicStaff[];
  selectedBarber: SelectedBarber | null;
  selectedDateTime: SelectedDateTime | null;
  onDateTimeChange: (dateTime: SelectedDateTime) => void;
  totalDuration: number;
  onNext: () => void;
  onBack: () => void;
}

export function DateTimeSelection({
  barbershop,
  staff,
  selectedBarber,
  selectedDateTime,
  onDateTimeChange,
  totalDuration,
  onNext,
  onBack,
}: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    selectedDateTime?.date || new Date()
  );

  const staffUserId = selectedBarber?.id === "any" ? "any" : selectedBarber?.userId;

  const { data: availableSlots, isLoading: slotsLoading } = useAvailableSlots(
    barbershop,
    selectedDate || new Date(),
    totalDuration,
    staffUserId,
    staff
  );

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onDateTimeChange({ date: selectedDate, time });
    }
  };

  const isTimeSelected = (time: string) => {
    return (
      selectedDateTime?.time === time &&
      selectedDate &&
      selectedDateTime?.date &&
      isSameDay(selectedDate, selectedDateTime.date)
    );
  };

  const maxDate = addDays(new Date(), barbershop.booking_window_days);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          ¿Cuándo quieres venir?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Duración total: {totalDuration} minutos
        </p>
      </div>

      {/* Calendar */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            disabled={(date) =>
              date < new Date() || date > maxDate
            }
            locale={es}
            className="mx-auto"
          />
        </CardContent>
      </Card>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-foreground">
            <Clock className="h-4 w-4" />
            Horarios disponibles para{" "}
            {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </h2>
          {slotsLoading ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : availableSlots && availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleTimeSelect(slot.time)}
                  className={cn(
                    "rounded-lg border py-3 text-sm font-medium transition-all",
                    isTimeSelected(slot.time)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              No hay horarios disponibles para esta fecha. Prueba otro día.
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Atrás
        </Button>
        <Button
          variant="hero"
          size="lg"
          onClick={onNext}
          disabled={!selectedDateTime}
          className="flex-1"
        >
          Continuar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
