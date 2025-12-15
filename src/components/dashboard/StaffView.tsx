import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Calendar, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useAllStaff,
  useToggleStaffActive,
  type StaffProfile,
} from "@/hooks/useStaffManagement";
import { StaffFormDialog } from "./StaffFormDialog";
import { StaffAvailabilityDialog } from "./StaffAvailabilityDialog";
import { Skeleton } from "@/components/ui/skeleton";

export function StaffView() {
  const { data: staff, isLoading } = useAllStaff();
  const toggleActive = useToggleStaffActive();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [availabilityStaff, setAvailabilityStaff] = useState<StaffProfile | null>(null);

  const handleEdit = (member: StaffProfile) => {
    setEditingStaff(member);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  const handleToggleActive = async (member: StaffProfile) => {
    await toggleActive.mutateAsync({
      id: member.id,
      is_active: !member.is_active,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeStaff = staff?.filter((s) => s.is_active) || [];
  const inactiveStaff = staff?.filter((s) => !s.is_active) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Barberos
          </h1>
          <p className="text-muted-foreground">Gestiona tu equipo</p>
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
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : staff?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-display font-semibold">
              Sin barberos aún
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Añade a tu primer barbero para empezar
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Añadir barbero
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active staff */}
          {activeStaff.length > 0 && (
            <div className="space-y-3">
              {activeStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onEditAvailability={setAvailabilityStaff}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}

          {/* Inactive staff */}
          {inactiveStaff.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Inactivos
              </p>
              {inactiveStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onEditAvailability={setAvailabilityStaff}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <StaffFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        staff={editingStaff}
      />

      <StaffAvailabilityDialog
        open={!!availabilityStaff}
        onOpenChange={() => setAvailabilityStaff(null)}
        staff={availabilityStaff}
      />
    </div>
  );
}

function StaffCard({
  member,
  onEdit,
  onToggleActive,
  onEditAvailability,
  getInitials,
}: {
  member: StaffProfile;
  onEdit: (member: StaffProfile) => void;
  onToggleActive: (member: StaffProfile) => void;
  onEditAvailability: (member: StaffProfile) => void;
  getInitials: (name: string) => string;
}) {
  return (
    <Card className={!member.is_active ? "opacity-60" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.photo_url || undefined} />
            <AvatarFallback
              style={{ backgroundColor: member.color_tag || "#E45500" }}
              className="text-white font-medium"
            >
              {getInitials(member.display_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {member.display_name}
              </h3>
              {!member.is_active && (
                <Badge variant="secondary" className="shrink-0">
                  Inactivo
                </Badge>
              )}
            </div>
            {member.commission_rate && (
              <p className="text-sm text-muted-foreground">
                Comisión: {member.commission_rate}%
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditAvailability(member)}
              className="h-9 w-9"
              title="Disponibilidad"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
              className="h-9 w-9"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Switch
              checked={member.is_active}
              onCheckedChange={() => onToggleActive(member)}
              aria-label="Activar/Desactivar"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
