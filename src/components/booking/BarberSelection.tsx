import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, ArrowLeft, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedBarber } from "@/pages/booking/PublicBooking";
import type { PublicStaff } from "@/hooks/usePublicBooking";

interface BarberSelectionProps {
  staff: PublicStaff[];
  selectedBarber: SelectedBarber | null;
  onBarberChange: (barber: SelectedBarber) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BarberSelection({
  staff,
  selectedBarber,
  onBarberChange,
  onNext,
  onBack,
}: BarberSelectionProps) {
  // Create barber options with "any" option first
  const barberOptions: SelectedBarber[] = [
    { id: "any", name: "Cualquiera disponible", photoUrl: undefined },
    ...staff.map((s) => ({
      id: s.id,
      name: s.display_name,
      photoUrl: s.photo_url || undefined,
      userId: s.user_id,
    })),
  ];

  if (staff.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Elige tu barbero
          </h1>
          <p className="mt-1 text-muted-foreground">
            O deja que te asignemos el primero disponible
          </p>
        </div>
        <div className="rounded-lg bg-muted p-8 text-center text-muted-foreground">
          No hay barberos disponibles en este momento.
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Atrás
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Elige tu barbero
        </h1>
        <p className="mt-1 text-muted-foreground">
          O deja que te asignemos el primero disponible
        </p>
      </div>

      <div className="grid gap-3">
        {barberOptions.map((barber) => (
          <Card
            key={barber.id}
            variant="interactive"
            className={cn(
              "cursor-pointer transition-all",
              selectedBarber?.id === barber.id && "border-primary bg-primary/5"
            )}
            onClick={() => onBarberChange(barber)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {barber.id === "any" ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Shuffle className="h-5 w-5 text-muted-foreground" />
                </div>
              ) : (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={barber.photoUrl} />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {barber.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">
                  {barber.name}
                </h3>
                {barber.id === "any" && (
                  <p className="text-sm text-muted-foreground">
                    Reserva más rápida disponible
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  selectedBarber?.id === barber.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedBarber?.id === barber.id && (
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
          disabled={!selectedBarber}
          className="flex-1"
        >
          Continuar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
