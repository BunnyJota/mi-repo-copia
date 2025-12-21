import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react";
import { useServices, useDeleteService, type Service } from "@/hooks/useServices";
import { ServiceFormDialog } from "./ServiceFormDialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useUserData } from "@/hooks/useUserData";
import { useI18n } from "@/i18n";

export function ServicesView() {
  const { data: services, isLoading } = useServices();
  const deleteService = useDeleteService();
  const { barbershop } = useUserData();
  const { lang } = useI18n();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    await deleteService.mutateAsync(deletingService.id);
    setDeletingService(null);
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price, barbershop?.currency || "USD", lang);
  };

  const activeServices = services?.filter((s) => s.is_active) || [];
  const inactiveServices = services?.filter((s) => !s.is_active) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Servicios
          </h1>
          <p className="text-muted-foreground">
            Gestiona los servicios que ofreces
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-display font-semibold">
              Sin servicios aún
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Crea tu primer servicio para empezar a recibir reservas
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Crear servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active services */}
          {activeServices.length > 0 && (
            <div className="space-y-3">
              {activeServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEdit}
                  onDelete={setDeletingService}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}

          {/* Inactive services */}
          {inactiveServices.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Inactivos
              </p>
              {inactiveServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEdit}
                  onDelete={setDeletingService}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ServiceFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        service={editingService}
      />

      <AlertDialog
        open={!!deletingService}
        onOpenChange={() => setDeletingService(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio "
              {deletingService?.name}" será eliminado permanentemente.
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

function ServiceCard({
  service,
  onEdit,
  onDelete,
  formatPrice,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  formatPrice: (price: number) => string;
}) {
  return (
    <Card className={!service.is_active ? "opacity-60" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {service.name}
              </h3>
              {!service.is_active && (
                <Badge variant="secondary" className="shrink-0">
                  Inactivo
                </Badge>
              )}
            </div>
            {service.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {service.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-primary font-medium">
                <DollarSign className="h-3.5 w-3.5" />
                {formatPrice(service.price)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {service.duration_min} min
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(service)}
              className="h-9 w-9"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(service)}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
