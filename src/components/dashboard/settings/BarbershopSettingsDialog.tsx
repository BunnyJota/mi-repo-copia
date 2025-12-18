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
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BarbershopSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarbershopSettingsDialog({ open, onOpenChange }: BarbershopSettingsDialogProps) {
  const { barbershop, loading: userDataLoading } = useUserData();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    brand_accent: "#E45500",
  });

  useEffect(() => {
    if (barbershop) {
      setFormData({
        name: barbershop.name || "",
        phone: barbershop.phone || "",
        address: barbershop.address || "",
        brand_accent: barbershop.brand_accent || "#E45500",
      });
    }
  }, [barbershop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userDataLoading) {
      toast.message("Cargando datos", { description: "Espera un momento y vuelve a guardar." });
      return;
    }
    if (!barbershop?.id) {
      toast.error("No se encontró tu barbería. Completa el registro inicial.");
      return;
    }

    if (!formData.name) {
      toast.error("El nombre de la barbería es obligatorio.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("barbershops")
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          brand_accent: formData.brand_accent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", barbershop.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["user-data"] });
      toast.success("Barbería actualizada correctamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating barbershop:", error);
      toast.error("Error al actualizar la barbería");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mi barbería</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la barbería</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Mi Barbería"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Calle Principal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_accent">Color de marca</Label>
            <div className="flex items-center gap-3">
              <Input
                id="brand_accent"
                type="color"
                value={formData.brand_accent}
                onChange={(e) => setFormData({ ...formData, brand_accent: e.target.value })}
                className="h-10 w-14 p-1 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{formData.brand_accent}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || userDataLoading || !barbershop?.id}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
