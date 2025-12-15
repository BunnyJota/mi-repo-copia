import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedService } from "@/pages/booking/PublicBooking";
import type { PublicService } from "@/hooks/usePublicBooking";

interface ServiceSelectionProps {
  services: PublicService[];
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  onNext: () => void;
}

export function ServiceSelection({
  services,
  selectedServices,
  onServicesChange,
  onNext,
}: ServiceSelectionProps) {
  const toggleService = (service: PublicService) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) {
      onServicesChange(selectedServices.filter((s) => s.id !== service.id));
    } else {
      onServicesChange([
        ...selectedServices,
        {
          id: service.id,
          name: service.name,
          duration: service.duration_min,
          price: service.price,
        },
      ]);
    }
  };

  const isSelected = (id: string) => selectedServices.some((s) => s.id === id);

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

  if (services.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            ¿Qué servicio necesitas?
          </h1>
          <p className="mt-1 text-muted-foreground">
            Selecciona uno o más servicios
          </p>
        </div>
        <div className="rounded-lg bg-muted p-8 text-center text-muted-foreground">
          No hay servicios disponibles en este momento.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          ¿Qué servicio necesitas?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Selecciona uno o más servicios
        </p>
      </div>

      <div className="grid gap-3">
        {services.map((service) => (
          <Card
            key={service.id}
            variant="interactive"
            className={cn(
              "cursor-pointer transition-all",
              isSelected(service.id) && "border-primary bg-primary/5"
            )}
            onClick={() => toggleService(service)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">
                  {service.name}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration_min} min
                  </span>
                  {service.description && (
                    <span className="truncate">{service.description}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold text-foreground">
                  ${service.price}
                </span>
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                    isSelected(service.id)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected(service.id) && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary and CTA */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg md:static md:border-0 md:p-0 md:shadow-none">
          <div className="container mx-auto flex items-center justify-between gap-4 md:flex-col md:items-stretch">
            <div className="text-sm md:flex md:items-center md:justify-between md:rounded-lg md:bg-muted md:p-4">
              <span className="text-muted-foreground">
                {selectedServices.length} servicio(s) • {totalDuration} min
              </span>
              <span className="font-display text-lg font-bold md:ml-4">
                Total: ${totalPrice}
              </span>
            </div>
            <Button
              variant="hero"
              size="lg"
              onClick={onNext}
              className="shrink-0"
            >
              Continuar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
