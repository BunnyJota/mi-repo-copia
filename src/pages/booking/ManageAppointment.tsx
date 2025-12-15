import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format, addDays, addMinutes, isSameDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Logo } from "@/components/layout/Logo";
import { 
  useAppointmentByToken, 
  useCancelAppointment, 
  useRescheduleAppointment,
  ManagedAppointment 
} from "@/hooks/useManageAppointment";
import { useAvailableSlots, usePublicStaff } from "@/hooks/usePublicBooking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ManageView = "details" | "reschedule";

const ManageAppointment = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAppointmentByToken(token);
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const [view, setView] = useState<ManageView>("details");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Get staff for reschedule
  const { data: staff } = usePublicStaff(
    data && "appointment" in data ? data.appointment.barbershop.id : undefined
  );

  // Calculate total duration
  const totalDuration = data && "appointment" in data
    ? data.appointment.services.reduce((acc, s) => acc + s.duration_min, 0)
    : 0;

  // Get available slots for reschedule
  const { data: availableSlots, isLoading: slotsLoading } = useAvailableSlots(
    data && "appointment" in data ? data.appointment.barbershop : null,
    selectedDate || new Date(),
    totalDuration,
    undefined,
    staff
  );

  const handleCancel = async () => {
    if (!token || !data || !("appointment" in data)) return;

    try {
      await cancelMutation.mutateAsync({
        appointmentId: data.appointment.id,
        token,
      });
      toast.success("Cita cancelada exitosamente");
      setShowCancelDialog(false);
    } catch (error) {
      toast.error("Error al cancelar la cita");
    }
  };

  const handleReschedule = async () => {
    if (!token || !data || !("appointment" in data) || !selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const newStartAt = new Date(selectedDate);
    newStartAt.setHours(hours, minutes, 0, 0);
    const newEndAt = addMinutes(newStartAt, totalDuration);

    try {
      await rescheduleMutation.mutateAsync({
        appointmentId: data.appointment.id,
        token,
        newStartAt,
        newEndAt,
      });
      toast.success("Cita reprogramada exitosamente");
      setView("details");
      setSelectedDate(undefined);
      setSelectedTime(null);
    } catch (error) {
      toast.error("Error al reprogramar la cita");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-sunken">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-center">
            <Logo />
          </div>
        </header>
        <main className="container py-6">
          <div className="mx-auto max-w-lg space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error states
  if (!data || "error" in data) {
    const errorType = data?.error || "invalid";
    
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-sunken p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {errorType === "expired" ? "Enlace expirado" : "Enlace inválido"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {errorType === "expired"
              ? "Este enlace ha expirado. Por favor contacta a la barbería para gestionar tu cita."
              : "El enlace que seguiste no es válido o ha sido utilizado."}
          </p>
          <Button className="mt-6" onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const { appointment } = data;
  const isCanceled = appointment.status === "canceled" || appointment.status === "no_show";
  const isPast = new Date(appointment.start_at) < new Date();
  const canModify = !isCanceled && !isPast;

  return (
    <div className="min-h-screen bg-surface-sunken">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <span className="font-display text-lg font-semibold">
            {appointment.barbershop.name}
          </span>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto max-w-lg">
          <AnimatePresence mode="wait">
            {view === "details" ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Status */}
                <div className="flex items-center justify-center">
                  <div
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-full",
                      isCanceled
                        ? "bg-destructive/10"
                        : isPast
                        ? "bg-muted"
                        : "bg-success/10"
                    )}
                  >
                    {isCanceled ? (
                      <XCircle className="h-10 w-10 text-destructive" />
                    ) : isPast ? (
                      <CheckCircle className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <CalendarIcon className="h-10 w-10 text-success" />
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {isCanceled
                      ? "Cita Cancelada"
                      : isPast
                      ? "Cita Completada"
                      : "Tu Cita"}
                  </h1>
                  <Badge
                    variant={
                      isCanceled
                        ? "canceled"
                        : isPast
                        ? "completed"
                        : "confirmed"
                    }
                    className="mt-2"
                  >
                    {isCanceled
                      ? "Cancelada"
                      : isPast
                      ? "Completada"
                      : appointment.status === "confirmed"
                      ? "Confirmada"
                      : "Pendiente"}
                  </Badge>
                </div>

                {/* Appointment details */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {format(
                            new Date(appointment.start_at),
                            "EEEE d 'de' MMMM 'de' yyyy",
                            { locale: es }
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">Fecha</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(appointment.start_at), "HH:mm")} -{" "}
                          {format(new Date(appointment.end_at), "HH:mm")}
                        </p>
                        <p className="text-sm text-muted-foreground">Hora</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{appointment.staff.display_name}</p>
                        <p className="text-sm text-muted-foreground">Barbero</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Scissors className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {appointment.services.map((s) => s.name).join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">Servicios</p>
                      </div>
                    </div>

                    {appointment.barbershop.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{appointment.barbershop.address}</p>
                          <p className="text-sm text-muted-foreground">Dirección</p>
                        </div>
                      </div>
                    )}

                    {appointment.barbershop.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{appointment.barbershop.phone}</p>
                          <p className="text-sm text-muted-foreground">Teléfono</p>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total a pagar</span>
                        <span className="font-display text-xl font-bold text-primary">
                          ${appointment.total_price_estimated}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                {canModify && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => setView("reschedule")}
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Reprogramar cita
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <XCircle className="mr-2 h-5 w-5" />
                      Cancelar cita
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Volver al inicio
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="reschedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setView("details");
                    setSelectedDate(undefined);
                    setSelectedTime(null);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>

                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Reprogramar cita
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    Selecciona una nueva fecha y hora
                  </p>
                </div>

                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      disabled={(date) =>
                        date < new Date() ||
                        date > addDays(new Date(), appointment.barbershop.booking_window_days)
                      }
                      locale={es}
                      className="mx-auto"
                    />
                  </CardContent>
                </Card>

                {selectedDate && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-foreground">
                      <Clock className="h-4 w-4" />
                      Horarios disponibles
                    </h2>
                    {slotsLoading ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(8)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : availableSlots && availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            className={cn(
                              "rounded-lg border py-3 text-sm font-medium transition-all",
                              selectedTime === slot.time
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
                        No hay horarios disponibles para esta fecha.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={!selectedDate || !selectedTime || rescheduleMutation.isPending}
                  onClick={handleReschedule}
                >
                  {rescheduleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Reprogramando...
                    </>
                  ) : (
                    "Confirmar nueva fecha"
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La barbería será notificada de la
              cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sí, cancelar cita"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageAppointment;
