import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useActivateSubscription } from "@/hooks/useSubscription";

type CallbackStatus = "loading" | "success" | "error";

const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activateSubscription = useActivateSubscription();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const subscriptionId = searchParams.get("subscription_id");
      const token = searchParams.get("token");

      if (!subscriptionId && !token) {
        setStatus("error");
        setMessage("No se recibió información de la suscripción");
        return;
      }

      try {
        // PayPal redirige con subscription_id o token
        // El subscription_id es el más común
        const idToUse = subscriptionId || token;
        
        if (!idToUse) {
          setStatus("error");
          setMessage("No se pudo identificar la suscripción");
          return;
        }

        // Activar la suscripción
        await activateSubscription.mutateAsync(idToUse);
        
        setStatus("success");
        setMessage("¡Suscripción activada exitosamente!");
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate("/dashboard?tab=settings");
        }, 2000);
      } catch (error: any) {
        console.error("Error processing subscription callback:", error);
        setStatus("error");
        setMessage(error.message || "Error al activar la suscripción");
      }
    };

    processCallback();
  }, [searchParams, activateSubscription, navigate]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Procesando suscripción...
            </h1>
            <p className="text-muted-foreground">
              Por favor espera mientras activamos tu suscripción
            </p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              ¡Suscripción activada!
            </h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Error al activar suscripción
            </h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-center">
          <Logo />
        </div>
      </header>

      {/* Main content */}
      <main className="container flex flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            {renderContent()}
            
            {status !== "loading" && (
              <div className="mt-8 space-y-3">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => navigate("/dashboard?tab=settings")}
                >
                  Ir a configuración
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubscriptionCallback;
