import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCreateStaff,
  useUpdateStaff,
  type StaffProfile,
} from "@/hooks/useStaffManagement";

const COLOR_OPTIONS = [
  "#E45500",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#6366F1",
  "#14B8A6",
];

const createStaffSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  display_name: z.string().min(1, "El nombre es requerido").max(100),
  color_tag: z.string(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
});

const editStaffSchema = z.object({
  display_name: z.string().min(1, "El nombre es requerido").max(100),
  color_tag: z.string(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
});

type CreateStaffValues = z.infer<typeof createStaffSchema>;
type EditStaffValues = z.infer<typeof editStaffSchema>;

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffProfile | null;
}

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
}: StaffFormDialogProps) {
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const isEditing = !!staff;

  const form = useForm<CreateStaffValues>({
    resolver: zodResolver(isEditing ? editStaffSchema : createStaffSchema),
    defaultValues: {
      email: "",
      password: "",
      display_name: "",
      color_tag: COLOR_OPTIONS[0],
      commission_rate: undefined,
    },
  });

  useEffect(() => {
    if (staff) {
      form.reset({
        email: "",
        password: "",
        display_name: staff.display_name,
        color_tag: staff.color_tag || COLOR_OPTIONS[0],
        commission_rate: staff.commission_rate || undefined,
      });
    } else {
      form.reset({
        email: "",
        password: "",
        display_name: "",
        color_tag: COLOR_OPTIONS[0],
        commission_rate: undefined,
      });
    }
  }, [staff, form]);

  const onSubmit = async (values: CreateStaffValues) => {
    try {
      if (isEditing && staff) {
        await updateStaff.mutateAsync({
          id: staff.id,
          display_name: values.display_name,
          color_tag: values.color_tag,
          commission_rate: values.commission_rate || null,
        });
      } else {
        await createStaff.mutateAsync({
          email: values.email,
          password: values.password,
          display_name: values.display_name,
          color_tag: values.color_tag,
          commission_rate: values.commission_rate,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createStaff.isPending || updateStaff.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar barbero" : "Nuevo barbero"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="barbero@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color_tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color identificativo</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            field.value === color
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comisión % (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ej: 30"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Guardando..." : isEditing ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
