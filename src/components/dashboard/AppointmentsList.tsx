import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Clock,
  MoreVertical,
  CheckCircle,
  XCircle,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAppointments, useDeleteAppointment } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useUserData } from "@/hooks/useUserData";
import { useI18n } from "@/i18n";
import { Trash2 } from "lucide-react";
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

type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled" | "no_show" | "rescheduled";

const statusConfig: Record<AppointmentStatus, { label: string; variant: "pending" | "confirmed" | "completed" | "canceled" }> = {
  pending: { label: "Pendiente", variant: "pending" },
  confirmed: { label: "Confirmada", variant: "confirmed" },
  completed: { label: "Completada", variant: "completed" },
  canceled: { label: "Cancelada", variant: "canceled" },
  no_show: { label: "No asistió", variant: "canceled" },
  rescheduled: { label: "Reprogramada", variant: "pending" },
};

export function AppointmentsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: appointments, isLoading } = useAppointments();
  const { barbershop, isOwner } = useUserData();
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const deleteAppointment = useDeleteAppointment();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: string; total: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "other">("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [deletingAppointment, setDeletingAppointment] = useState<{ id: string; clientName: string } | null>(null);

  const handleDelete = async () => {
    if (!deletingAppointment) return;
    await deleteAppointment.mutateAsync(deletingAppointment.id);
    setDeletingAppointment(null);
  };

  const updateAppointmentStatus = async (appointmentId: string, status: "completed" | "canceled") => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      toast.success(status === "completed" ? "Cita marcada como completada" : "Cita cancelada");
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Error al actualizar la cita");
    }
  };

  const handleMarkAsPaid = (appointmentId: string, total: number) => {
    setSelectedAppointment({ id: appointmentId, total });
    setPaymentAmount(total.toFixed(2));
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedAppointment) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          payment_status: "paid",
          payment_method: paymentMethod,
          payment_amount: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedAppointment.id);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      toast.success("Pago registrado correctamente");
      setPaymentDialogOpen(false);
      setSelectedAppointment(null);
      setPaymentAmount("");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Error al registrar el pago");
    }
  };

  const filteredAppointments = (appointments || []).filter(
    (apt) =>
      apt.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Citas
        </h1>
        <p className="text-muted-foreground">Gestiona todas las citas</p>
      </div>

      {/* Search and filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Appointments list */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <AppointmentCardSkeleton />
            <AppointmentCardSkeleton />
            <AppointmentCardSkeleton />
          </>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {searchQuery ? "No se encontraron citas" : "No hay citas registradas"}
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <Card key={apt.id} variant="interactive">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {apt.client.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {apt.services.map((s) => s.name).join(", ")}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {apt.status === "completed" && apt.payment_status === "unpaid" && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(apt.id, apt.total_price_estimated)}>
                              <DollarSign className="mr-2 h-4 w-4 text-success" />
                              Marcar como pagado
                            </DropdownMenuItem>
                          )}
                          {apt.status !== "completed" && (
                            <DropdownMenuItem onClick={() => updateAppointmentStatus(apt.id, "completed")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-success" />
                              Marcar completada
                            </DropdownMenuItem>
                          )}
                          {apt.status !== "canceled" && (
                            <DropdownMenuItem onClick={() => updateAppointmentStatus(apt.id, "canceled")}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" />
                              Cancelar cita
                            </DropdownMenuItem>
                          )}
                          {isOwner && (
                            <DropdownMenuItem
                              onClick={() => setDeletingAppointment({ id: apt.id, clientName: apt.client.name })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar cita
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(apt.start_at), "d MMM", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(apt.start_at), "HH:mm")}
                      </span>
                      <span>• {apt.staff?.display_name || "Sin asignar"}</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(apt.total_price_estimated, barbershop?.currency || "USD", lang)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={statusConfig[apt.status]?.variant || "pending"}>
                        {statusConfig[apt.status]?.label || apt.status}
                      </Badge>
                      {apt.status === "completed" && (
                        <Badge variant={apt.payment_status === "paid" ? "completed" : "pending"}>
                          {apt.payment_status === "paid" ? "Pagado" : "Pendiente de pago"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Marca esta cita como pagada y registra el método de pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "cash" | "card" | "other")}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmPayment}>
                Confirmar Pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingAppointment}
        onOpenChange={() => setDeletingAppointment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita de "{deletingAppointment?.clientName}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AppointmentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
