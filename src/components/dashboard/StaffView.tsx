import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Calendar, User, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useAllStaff,
  useToggleStaffActive,
  useDeleteStaff,
  type StaffProfile,
} from "@/hooks/useStaffManagement";
import { StaffFormDialog } from "./StaffFormDialog";
import { StaffAvailabilityDialog } from "./StaffAvailabilityDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserData } from "@/hooks/useUserData";
import { useI18n } from "@/i18n";
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

export function StaffView() {
  const { data: staff, isLoading } = useAllStaff();
  const toggleActive = useToggleStaffActive();
  const deleteStaff = useDeleteStaff();
  const { isOwner } = useUserData();
  const { t } = useI18n();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [availabilityStaff, setAvailabilityStaff] = useState<StaffProfile | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffProfile | null>(null);

  const handleDelete = async () => {
    if (!deletingStaff) return;
    await deleteStaff.mutateAsync(deletingStaff.id);
    setDeletingStaff(null);
  };

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
            {t("staff.title" as any)}
          </h1>
          <p className="text-muted-foreground">{t("staff.subtitle" as any)}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("staff.new" as any)}
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
              {t("staff.emptyTitle" as any)}
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {t("staff.emptySubtitle" as any)}
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              {t("staff.add" as any)}
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
                  onDelete={setDeletingStaff}
                  getInitials={getInitials}
                  canDelete={isOwner}
                />
              ))}
            </div>
          )}

          {/* Inactive staff */}
          {inactiveStaff.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {t("staff.inactive" as any)}
              </p>
              {inactiveStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onEditAvailability={setAvailabilityStaff}
                  onDelete={setDeletingStaff}
                  getInitials={getInitials}
                  canDelete={isOwner}
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

      <AlertDialog
        open={!!deletingStaff}
        onOpenChange={() => setDeletingStaff(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("staff.deleteDialog.title" as any)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("staff.deleteDialog.description" as any).replace(
                "{name}",
                deletingStaff?.display_name || "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("staff.actions.cancel" as any)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("staff.actions.delete" as any)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StaffCard({
  member,
  onEdit,
  onToggleActive,
  onEditAvailability,
  onDelete,
  getInitials,
  canDelete,
}: {
  member: StaffProfile;
  onEdit: (member: StaffProfile) => void;
  onToggleActive: (member: StaffProfile) => void;
  onEditAvailability: (member: StaffProfile) => void;
  onDelete: (member: StaffProfile) => void;
  getInitials: (name: string) => string;
  canDelete: boolean;
}) {
  const { t } = useI18n();
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
                  {t("staff.inactiveBadge" as any)}
                </Badge>
              )}
            </div>
            {member.commission_rate && (
              <p className="text-sm text-muted-foreground">
                {t("staff.commission" as any).replace("{rate}", String(member.commission_rate))}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditAvailability(member)}
              className="h-9 w-9"
              title={t("staff.actions.availability" as any)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
              className="h-9 w-9"
              title={t("staff.actions.edit" as any)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(member)}
                className="h-9 w-9 text-destructive hover:text-destructive"
                title={t("staff.actions.delete" as any)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
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
