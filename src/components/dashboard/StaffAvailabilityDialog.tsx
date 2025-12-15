import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useStaffAvailability,
  useSaveStaffAvailability,
  type StaffProfile,
} from "@/hooks/useStaffManagement";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

interface DayRule {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_enabled: boolean;
}

interface StaffAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffProfile | null;
}

export function StaffAvailabilityDialog({
  open,
  onOpenChange,
  staff,
}: StaffAvailabilityDialogProps) {
  const { data: existingRules, isLoading } = useStaffAvailability(
    staff?.user_id || null
  );
  const saveAvailability = useSaveStaffAvailability();

  const [rules, setRules] = useState<DayRule[]>(
    DAYS.map((day) => ({
      day_of_week: day.value,
      open_time: "09:00",
      close_time: "18:00",
      is_enabled: day.value >= 1 && day.value <= 5, // Mon-Fri enabled by default
    }))
  );

  useEffect(() => {
    if (existingRules && existingRules.length > 0) {
      const mappedRules = DAYS.map((day) => {
        const existing = existingRules.find(
          (r) => r.day_of_week === day.value
        );
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            open_time: existing.open_time,
            close_time: existing.close_time,
            is_enabled: existing.is_enabled,
          };
        }
        return {
          day_of_week: day.value,
          open_time: "09:00",
          close_time: "18:00",
          is_enabled: false,
        };
      });
      setRules(mappedRules);
    }
  }, [existingRules]);

  const handleToggleDay = (dayIndex: number) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.day_of_week === dayIndex
          ? { ...rule, is_enabled: !rule.is_enabled }
          : rule
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "open_time" | "close_time",
    value: string
  ) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.day_of_week === dayIndex ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleSave = async () => {
    if (!staff) return;
    await saveAvailability.mutateAsync({
      staffUserId: staff.user_id,
      rules,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Disponibilidad de {staff?.display_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const rule = rules.find((r) => r.day_of_week === day.value);
              if (!rule) return null;

              return (
                <div
                  key={day.value}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    rule.is_enabled ? "bg-muted/30" : "opacity-50"
                  }`}
                >
                  <Switch
                    checked={rule.is_enabled}
                    onCheckedChange={() => handleToggleDay(day.value)}
                  />
                  <span className="w-24 font-medium text-sm">{day.label}</span>

                  {rule.is_enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <Label className="sr-only">Apertura</Label>
                        <Input
                          type="time"
                          value={rule.open_time}
                          onChange={(e) =>
                            handleTimeChange(day.value, "open_time", e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                      <span className="text-muted-foreground text-sm">a</span>
                      <div className="flex-1">
                        <Label className="sr-only">Cierre</Label>
                        <Input
                          type="time"
                          value={rule.close_time}
                          onChange={(e) =>
                            handleTimeChange(day.value, "close_time", e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={saveAvailability.isPending}
              >
                {saveAvailability.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
