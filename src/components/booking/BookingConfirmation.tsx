import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, User, Scissors, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  SelectedService,
  SelectedBarber,
  SelectedDateTime,
  ClientData,
} from "@/pages/booking/PublicBooking";

interface BookingConfirmationProps {
  barbershopName: string;
  clientData: ClientData;
  selectedServices: SelectedService[];
  selectedBarber: SelectedBarber | null;
  selectedDateTime: SelectedDateTime | null;
  totalPrice: number;
}

export function BookingConfirmation({
  barbershopName,
  clientData,
  selectedServices,
  selectedBarber,
  selectedDateTime,
  totalPrice,
}: BookingConfirmationProps) {
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          ¡Cita confirmada!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hemos enviado los detalles a{" "}
          <span className="font-medium text-foreground">{clientData.email}</span>
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 border-b pb-4 text-left">
            <p className="text-sm text-muted-foreground">Reserva en</p>
            <p className="font-display font-semibold text-foreground">{barbershopName}</p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {selectedDateTime &&
                    format(selectedDateTime.date, "EEEE d 'de' MMMM 'de' yyyy", {
                      locale: es,
                    })}
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
                <p className="text-sm text-muted-foreground">Tu barbero</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scissors className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {selectedServices.map((s) => s.name).join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">Servicios</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{totalDuration} minutos</p>
                <p className="text-sm text-muted-foreground">Duración estimada</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total a pagar</span>
                <span className="font-display text-xl font-bold text-primary">
                  ${totalPrice}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Pago en el local
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Revisa tu email para gestionar tu cita</span>
        </div>

        <Button variant="outline" size="lg" className="w-full" asChild>
          <a href="/">Volver al inicio</a>
        </Button>
      </div>
    </div>
  );
}
