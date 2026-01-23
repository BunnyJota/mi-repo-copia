import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Mail, 
  Phone,
  Calendar,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClients, useDeleteClient, useUpdateClient } from "@/hooks/useClients";
import { useUserData } from "@/hooks/useUserData";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ClientsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const updateClient = useUpdateClient();
  const { isOwner } = useUserData();
  const { t, lang } = useI18n();
  const [deletingClient, setDeletingClient] = useState<{ id: string; name: string } | null>(null);
  const [editingClient, setEditingClient] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
  } | null>(null);
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});

  const handleDelete = async () => {
    if (!deletingClient) return;
    await deleteClient.mutateAsync(deletingClient.id);
    setDeletingClient(null);
  };

  const filteredClients = (clients || []).filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastVisit = (date: string | null) => {
    if (!date) return t("clients.lastVisit.none" as any);
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: lang === "en" ? enUS : es,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingClient) return;
    const errors: { name?: string; email?: string } = {};

    if (!editingClient.name.trim()) {
      errors.name = t("clients.editDialog.errors.nameRequired" as any);
    }
    if (!editingClient.email.trim()) {
      errors.email = t("clients.editDialog.errors.emailRequired" as any);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingClient.email)) {
      errors.email = t("clients.editDialog.errors.emailInvalid" as any);
    }

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateClient.mutateAsync({
        id: editingClient.id,
        name: editingClient.name.trim(),
        email: editingClient.email.trim(),
        phone: editingClient.phone.trim() || null,
        notes: editingClient.notes.trim() || null,
      });
      toast.success(t("clients.editDialog.success" as any));
      setEditingClient(null);
    } catch (error: any) {
      toast.error(t("clients.editDialog.error" as any).replace("{detail}", error?.message || ""));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("clients.title" as any)}
          </h1>
          <p className="text-muted-foreground">
            {isLoading
              ? t("clients.loading" as any)
              : t("clients.count" as any).replace("{count}", String(clients?.length ?? 0))}
          </p>
        </div>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("clients.new" as any)}</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("clients.searchPlaceholder" as any)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Clients list */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <ClientCardSkeleton />
            <ClientCardSkeleton />
            <ClientCardSkeleton />
          </>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {searchQuery ? t("clients.emptySearch" as any) : t("clients.empty" as any)}
          </div>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} variant="interactive">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 font-medium text-primary">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {client.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t("clients.actions.history" as any)}</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingClient({
                                id: client.id,
                                name: client.name,
                                email: client.email,
                                phone: client.phone || "",
                                notes: client.notes || "",
                              })
                            }
                          >
                            {t("clients.actions.edit" as any)}
                          </DropdownMenuItem>
                          <DropdownMenuItem>{t("clients.actions.newAppointment" as any)}</DropdownMenuItem>
                          {isOwner && (
                            <DropdownMenuItem
                              onClick={() => setDeletingClient({ id: client.id, name: client.name })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("clients.actions.delete" as any)}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t("clients.appointmentsCount" as any).replace(
                          "{count}",
                          String(client.appointment_count),
                        )}
                      </span>
                      <span>
                        {t("clients.lastVisit.label" as any)} {formatLastVisit(client.last_visit)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog
        open={!!deletingClient}
        onOpenChange={() => setDeletingClient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clients.deleteDialog.title" as any)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clients.deleteDialog.description" as any).replace(
                "{name}",
                deletingClient?.name || "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("clients.actions.cancel" as any)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("clients.actions.delete" as any)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("clients.editDialog.title" as any)}</DialogTitle>
            <DialogDescription>{t("clients.editDialog.subtitle" as any)}</DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">{t("clients.editDialog.nameLabel" as any)}</Label>
                <Input
                  id="client-name"
                  value={editingClient.name}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, name: e.target.value })
                  }
                />
                {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email">{t("clients.editDialog.emailLabel" as any)}</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={editingClient.email}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, email: e.target.value })
                  }
                />
                {editErrors.email && <p className="text-sm text-destructive">{editErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">{t("clients.editDialog.phoneLabel" as any)}</Label>
                <Input
                  id="client-phone"
                  value={editingClient.phone}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-notes">{t("clients.editDialog.notesLabel" as any)}</Label>
                <Textarea
                  id="client-notes"
                  value={editingClient.notes}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingClient(null)}>
                  {t("clients.actions.cancel" as any)}
                </Button>
                <Button onClick={handleEditSubmit} disabled={updateClient.isPending}>
                  {updateClient.isPending
                    ? t("clients.editDialog.saving" as any)
                    : t("clients.editDialog.save" as any)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
