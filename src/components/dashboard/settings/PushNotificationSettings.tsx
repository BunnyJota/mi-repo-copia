import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Users, User, Trash2 } from "lucide-react";
import { usePushNotifications, type NotificationPreferences } from "@/hooks/usePushNotifications";
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

interface PushNotificationSettingsProps {
  barbershopId: string | null;
  isOwner: boolean;
}

interface StaffMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
  preferences: NotificationPreferences | null;
}

export function PushNotificationSettings({ barbershopId, isOwner }: PushNotificationSettingsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    preferences,
    preferencesLoading,
    updatePreferences,
    isUpdatingPreferences,
    tokens,
    deleteToken,
  } = usePushNotifications(barbershopId);

  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);

  // Obtener empleados del barbershop (solo para owners)
  const { data: staffMembers, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-notification-preferences", barbershopId],
    queryFn: async () => {
      if (!barbershopId || !isOwner) return [];

      // Obtener todos los perfiles del barbershop
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .eq("barbershop_id", barbershopId);

      if (profilesError) throw profilesError;

      // Obtener preferencias de notificaciones para cada usuario
      const staffWithPrefs: StaffMember[] = [];
      for (const profile of profiles || []) {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", profile.user_id)
          .eq("barbershop_id", barbershopId)
          .single();

        staffWithPrefs.push({
          user_id: profile.user_id,
          display_name: profile.display_name,
          email: profile.email,
          preferences: prefs as NotificationPreferences | null,
        });
      }

      return staffWithPrefs;
    },
    enabled: !!barbershopId && isOwner,
  });

  // Actualizar preferencias de un empleado (solo owners)
  const updateStaffPreferencesMutation = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<NotificationPreferences>;
    }) => {
      if (!barbershopId) throw new Error("Barbershop ID required");

      const { data, error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", userId)
        .eq("barbershop_id", barbershopId)
        .select()
        .single();

      if (error) {
        // Si no existe, crear
        if (error.code === "PGRST116") {
          const { data: newPrefs, error: createError } = await supabase
            .from("notification_preferences")
            .insert({
              user_id: userId,
              barbershop_id: barbershopId,
              ...updates,
            })
            .select()
            .single();

          if (createError) throw createError;
          return newPrefs;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-notification-preferences"] });
      toast.success("Preferencias actualizadas");
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar preferencias: ${error.message}`);
    },
  });

  const handleUpdatePreference = (
    key: keyof NotificationPreferences,
    value: boolean,
    userId?: string
  ) => {
    if (userId && isOwner) {
      // Actualizar preferencias de empleado
      const currentPrefs = staffMembers?.find((s) => s.user_id === userId)?.preferences;
      updateStaffPreferencesMutation.mutate({
        userId,
        updates: {
          ...currentPrefs,
          [key]: value,
        } as Partial<NotificationPreferences>,
      });
    } else if (preferences) {
      // Actualizar preferencias propias
      updatePreferences({
        [key]: value,
      } as Partial<NotificationPreferences>);
    }
  };

  const handleDeleteToken = async () => {
    if (deleteTokenId) {
      deleteToken(deleteTokenId);
      setDeleteTokenId(null);
    }
  };

  if (preferencesLoading) {
    return <div className="text-sm text-muted-foreground">Cargando preferencias...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Mis preferencias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Mis notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-appointment" className="flex-1">
                Nuevas citas
                <p className="text-sm text-muted-foreground font-normal">
                  Recibir notificación cuando se agende una nueva cita
                </p>
              </Label>
              <Switch
                id="new-appointment"
                checked={preferences?.new_appointment_enabled ?? true}
                onCheckedChange={(checked) =>
                  handleUpdatePreference("new_appointment_enabled", checked)
                }
                disabled={isUpdatingPreferences}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-30min" className="flex-1">
                Recordatorio 30 minutos antes
                <p className="text-sm text-muted-foreground font-normal">
                  Recibir notificación 30 minutos antes de una cita
                </p>
              </Label>
              <Switch
                id="reminder-30min"
                checked={preferences?.reminder_30min_enabled ?? true}
                onCheckedChange={(checked) =>
                  handleUpdatePreference("reminder_30min_enabled", checked)
                }
                disabled={isUpdatingPreferences}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-2h" className="flex-1">
                Recordatorio 2 horas antes
                <p className="text-sm text-muted-foreground font-normal">
                  Recibir notificación 2 horas antes de una cita
                </p>
              </Label>
              <Switch
                id="reminder-2h"
                checked={preferences?.reminder_2h_enabled ?? false}
                onCheckedChange={(checked) =>
                  handleUpdatePreference("reminder_2h_enabled", checked)
                }
                disabled={isUpdatingPreferences}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-24h" className="flex-1">
                Recordatorio 24 horas antes
                <p className="text-sm text-muted-foreground font-normal">
                  Recibir notificación 24 horas antes de una cita
                </p>
              </Label>
              <Switch
                id="reminder-24h"
                checked={preferences?.reminder_24h_enabled ?? false}
                onCheckedChange={(checked) =>
                  handleUpdatePreference("reminder_24h_enabled", checked)
                }
                disabled={isUpdatingPreferences}
              />
            </div>
          </div>

          {/* Dispositivos registrados */}
          {tokens.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Dispositivos registrados</h4>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {token.device_name || `${token.device_type} Device`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {token.device_type} • Registrado{" "}
                        {new Date(token.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTokenId(token.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferencias de empleados (solo para owners) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Notificaciones de empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffLoading ? (
              <div className="text-sm text-muted-foreground">Cargando empleados...</div>
            ) : staffMembers && staffMembers.length > 0 ? (
              <div className="space-y-4">
                {staffMembers
                  .filter((staff) => staff.user_id !== user?.id) // Excluir al owner
                  .map((staff) => (
                    <div key={staff.user_id} className="border rounded-lg p-4 space-y-3">
                      <div>
                        <p className="font-medium">
                          {staff.display_name || staff.email || "Usuario sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">{staff.email}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`staff-${staff.user_id}-new`} className="text-sm">
                            Nuevas citas
                          </Label>
                          <Switch
                            id={`staff-${staff.user_id}-new`}
                            checked={staff.preferences?.new_appointment_enabled ?? true}
                            onCheckedChange={(checked) =>
                              handleUpdatePreference(
                                "new_appointment_enabled",
                                checked,
                                staff.user_id
                              )
                            }
                            disabled={updateStaffPreferencesMutation.isPending}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`staff-${staff.user_id}-30min`} className="text-sm">
                            Recordatorio 30 min
                          </Label>
                          <Switch
                            id={`staff-${staff.user_id}-30min`}
                            checked={staff.preferences?.reminder_30min_enabled ?? true}
                            onCheckedChange={(checked) =>
                              handleUpdatePreference(
                                "reminder_30min_enabled",
                                checked,
                                staff.user_id
                              )
                            }
                            disabled={updateStaffPreferencesMutation.isPending}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`staff-${staff.user_id}-2h`} className="text-sm">
                            Recordatorio 2h
                          </Label>
                          <Switch
                            id={`staff-${staff.user_id}-2h`}
                            checked={staff.preferences?.reminder_2h_enabled ?? false}
                            onCheckedChange={(checked) =>
                              handleUpdatePreference(
                                "reminder_2h_enabled",
                                checked,
                                staff.user_id
                              )
                            }
                            disabled={updateStaffPreferencesMutation.isPending}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`staff-${staff.user_id}-24h`} className="text-sm">
                            Recordatorio 24h
                          </Label>
                          <Switch
                            id={`staff-${staff.user_id}-24h`}
                            checked={staff.preferences?.reminder_24h_enabled ?? false}
                            onCheckedChange={(checked) =>
                              handleUpdatePreference(
                                "reminder_24h_enabled",
                                checked,
                                staff.user_id
                              )
                            }
                            disabled={updateStaffPreferencesMutation.isPending}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay empleados registrados en tu barbershop.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para confirmar eliminación de token */}
      <AlertDialog open={!!deleteTokenId} onOpenChange={(open) => !open && setDeleteTokenId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dispositivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Este dispositivo dejará de recibir notificaciones push. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteToken} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
