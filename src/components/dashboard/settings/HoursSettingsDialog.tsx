import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserData } from "@/hooks/useUserData";
import { useAvailabilityRules } from "@/hooks/useAvailabilityRules";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface HoursSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

interface DaySchedule {
  day_of_week: number;
  is_enabled: boolean;
  open_time: string;
  close_time: string;
}

export function HoursSettingsDialog({ open, onOpenChange }: HoursSettingsDialogProps) {
  const { barbershop } = useUserData();
  const { data: existingRules } = useAvailabilityRules();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  useEffect(() => {
    // Initialize schedule with existing rules or defaults
    const initialSchedule = DAYS_OF_WEEK.map(day => {
      const existing = existingRules?.find(r => r.day_of_week === day.value);
      return {
        day_of_week: day.value,
        is_enabled: existing?.is_enabled ?? (day.value >= 1 && day.value <= 6),
        open_time: existing?.open_time ?? "09:00",
        close_time: existing?.close_time ?? "19:00",
      };
    });
    setSchedule(initialSchedule);
  }, [existingRules]);

  const updateDay = (dayOfWeek: number, updates: Partial<DaySchedule>) => {
    setSchedule(prev => 
      prev.map(day => 
        day.day_of_week === dayOfWeek ? { ...day, ...updates } : day
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbershop?.id) return;

    setIsLoading(true);
    try {
      // Delete existing rules
      await supabase
        .from("availability_rules")
        .delete()
        .eq("barbershop_id", barbershop.id);

      // Insert new rules
      const { error } = await supabase
        .from("availability_rules")
        .insert(
          schedule.map(day => ({
            barbershop_id: barbershop.id,
            day_of_week: day.day_of_week,
            is_enabled: day.is_enabled,
            open_time: day.open_time,
            close_time: day.close_time,
          }))
        );

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      toast.success("Horarios actualizados correctamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating hours:", error);
      toast.error("Error al actualizar los horarios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Horarios de apertura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {DAYS_OF_WEEK.map(day => {
              const daySchedule = schedule.find(s => s.day_of_week === day.value);
              if (!daySchedule) return null;
              
              return (
                <div key={day.value} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-24">
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  <Switch
                    checked={daySchedule.is_enabled}
                    onCheckedChange={(checked) => updateDay(day.value, { is_enabled: checked })}
                  />
                  {daySchedule.is_enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={daySchedule.open_time}
                        onChange={(e) => updateDay(day.value, { open_time: e.target.value })}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={daySchedule.close_time}
                        onChange={(e) => updateDay(day.value, { close_time: e.target.value })}
                        className="w-28"
                      />
                    </div>
                  )}
                  {!daySchedule.is_enabled && (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
