import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Clock, Bell, Smartphone, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUserData } from "@/hooks/useUserData";
import { PushNotificationSettings } from "./PushNotificationSettings";

interface NotificationsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSettingsDialog({ open, onOpenChange }: NotificationsSettingsDialogProps) {
  const { barbershop, isOwner } = useUserData();
  const {
    isSupported,
    permission,
    preferences,
    preferencesLoading,
    requestPermission,
    updatePreferences,
    isUpdatingPreferences,
  } = usePushNotifications(barbershop?.id || null);

  const [settings, setSettings] = useState({
    confirmationEmail: true,
    reminder24h: true,
    reminder2h: true,
    cancellationEmail: true,
  });

  // Sincronizar preferencias cuando se carguen
  useEffect(() => {
    if (preferences) {
      setSettings({
        confirmationEmail: true, // Email settings no están en la BD aún
        reminder24h: preferences.reminder_24h_enabled,
        reminder2h: preferences.reminder_2h_enabled,
        cancellationEmail: true,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    if (preferences) {
      updatePreferences({
        reminder_24h_enabled: settings.reminder24h,
        reminder_2h_enabled: settings.reminder2h,
      });
    }
    toast.success("Preferencias de notificaciones guardadas");
    onOpenChange(false);
  };

  const handleEnablePushNotifications = async () => {
    await requestPermission();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración de notificaciones</DialogTitle>
          <DialogDescription>
            Gestiona tus preferencias de notificaciones por email y push
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="push" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="push">
              <Smartphone className="h-4 w-4 mr-2" />
              Push Notifications
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Emails
            </TabsTrigger>
          </TabsList>

          <TabsContent value="push" className="space-y-6 mt-4">
            {!isSupported && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning">
                    Notificaciones push no soportadas
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu navegador no soporta notificaciones push. Prueba con Chrome, Firefox o Edge.
                  </p>
                </div>
              </div>
            )}

            {isSupported && permission === "denied" && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Permisos de notificaciones denegados
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ve a la configuración de tu navegador para permitir notificaciones de este sitio.
                  </p>
                </div>
              </div>
            )}

            {isSupported && permission !== "granted" && permission !== "denied" && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Activar notificaciones push</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recibe notificaciones instantáneas en tu dispositivo cuando haya nuevas citas o recordatorios.
                    </p>
                  </div>
                  <Button onClick={handleEnablePushNotifications} size="sm">
                    Activar
                  </Button>
                </div>
              </div>
            )}

            {isSupported && permission === "granted" && (
              <PushNotificationSettings 
                barbershopId={barbershop?.id || null}
                isOwner={isOwner}
              />
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Emails automáticos</h3>
              </div>
              
              <div className="space-y-3 pl-8">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmation" className="flex-1">
                    Confirmación de cita
                    <p className="text-sm text-muted-foreground font-normal">
                      Al crear una nueva cita
                    </p>
                  </Label>
                  <Switch
                    id="confirmation"
                    checked={settings.confirmationEmail}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, confirmationEmail: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="cancellation" className="flex-1">
                    Cancelación de cita
                    <p className="text-sm text-muted-foreground font-normal">
                      Al cancelar una cita
                    </p>
                  </Label>
                  <Switch
                    id="cancellation"
                    checked={settings.cancellationEmail}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, cancellationEmail: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Recordatorios</h3>
              </div>
              
              <div className="space-y-3 pl-8">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder24h" className="flex-1">
                    24 horas antes
                    <p className="text-sm text-muted-foreground font-normal">
                      Recordatorio un día antes
                    </p>
                  </Label>
                  <Switch
                    id="reminder24h"
                    checked={settings.reminder24h}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, reminder24h: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder2h" className="flex-1">
                    2 horas antes
                    <p className="text-sm text-muted-foreground font-normal">
                      Recordatorio el mismo día
                    </p>
                  </Label>
                  <Switch
                    id="reminder2h"
                    checked={settings.reminder2h}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, reminder2h: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdatingPreferences || preferencesLoading}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
