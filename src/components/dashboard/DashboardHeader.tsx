import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";

export function DashboardHeader() {
  const { signOut } = useAuth();
  const { profile, barbershop, subscription, trialDaysRemaining, loading } = useUserData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    if (subscription.status === "trial") {
      return (
        <Badge variant="trial" className="text-xs">
          Trial: {trialDaysRemaining} días
        </Badge>
      );
    }
    
    if (subscription.status === "active") {
      return <Badge variant="active" className="text-xs">Activo</Badge>;
    }
    
    if (subscription.status === "past_due") {
      return <Badge variant="pastdue" className="text-xs">Pago pendiente</Badge>;
    }
    
    return null;
  };

  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-base font-semibold sm:text-lg">
            {loading ? "Cargando..." : barbershop?.name || "Mi barbería"}
          </h1>
        </div>
        {getSubscriptionBadge()}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                  {getInitials(profile?.display_name || null)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.display_name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
