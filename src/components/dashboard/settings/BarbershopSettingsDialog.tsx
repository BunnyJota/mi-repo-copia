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
import { getAppUrl } from "@/lib/utils";

interface BarbershopSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarbershopSettingsDialog({ open, onOpenChange }: BarbershopSettingsDialogProps) {
  const { barbershop } = useUserData();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone: "",
    address: "",
    brand_accent: "#E45500",
  });

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  useEffect(() => {
    if (barbershop) {
      setFormData({
        name: barbershop.name || "",
        slug: barbershop.slug || "",
        phone: barbershop.phone || "",
        address: barbershop.address || "",
        brand_accent: barbershop.brand_accent || "#E45500",
      });
    }
  }, [barbershop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbershop?.id) {
      toast.error("Primero completa el registro de tu barbería.");
      return;
    }

    if (!formData.name || !formData.slug) {
      toast.error("Nombre y URL pública son obligatorios.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("barbershops")
        .update({
          name: formData.name,
          slug: formData.slug,
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
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name,
                  slug: formData.slug || slugify(name),
                });
              }}
              placeholder="Mi Barbería"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL pública (slug)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground select-none">
                {`${getAppUrl()}/b/`}
              </span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                placeholder="mi-barberia"
                required
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Este es el enlace que compartirás con tus clientes. Puedes editarlo si lo necesitas.
            </p>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
