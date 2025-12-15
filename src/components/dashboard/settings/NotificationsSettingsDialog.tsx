import { useState } from "react";
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
import { toast } from "sonner";
import { Mail, Clock } from "lucide-react";

interface NotificationsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSettingsDialog({ open, onOpenChange }: NotificationsSettingsDialogProps) {
  const [settings, setSettings] = useState({
    confirmationEmail: true,
    reminder24h: true,
    reminder2h: true,
    cancellationEmail: true,
  });

  const handleSave = () => {
    // For now, just show a success message
    // TODO: Implement backend storage for notification preferences
    toast.success("Preferencias de notificaciones guardadas");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notificaciones por email</DialogTitle>
          <DialogDescription>
            Configura qué emails enviar a tus clientes
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
