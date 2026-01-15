import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useActivateSubscription } from "@/hooks/useSubscription";
import { useUserData } from "@/hooks/useUserData";

type CallbackStatus = "loading" | "success" | "error";

const SubscriptionCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activateSubscription = useActivateSubscription();
  const { loading: userDataLoading } = useUserData();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("");
  const [hasProcessed, setHasProcessed] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Timeout de seguridad: si userDataLoading nunca termina, procesar después de 10 segundos
    const timeoutId = setTimeout(() => {
      if (userDataLoading && !hasProcessed) {
        console.warn("Timeout reached while waiting for userData to load");
        setTimeoutReached(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeoutId);
  }, [userDataLoading, hasProcessed]);

  useEffect(() => {
    // Esperar a que los datos del usuario estén cargados antes de procesar
    // O procesar si se alcanzó el timeout
    if ((userDataLoading && !timeoutReached) || hasProcessed) {
      return;
    }

    const processCallback = async () => {
      setHasProcessed(true);
      
      // PayPal puede redirigir con diferentes parámetros
      const subscriptionId = searchParams.get("subscription_id");
      const token = searchParams.get("token");
      const baToken = searchParams.get("ba_token"); // Billing Agreement token

      // Priorizar subscription_id, luego token, luego ba_token
      const idToUse = subscriptionId || token || baToken;

      if (!idToUse) {
        setStatus("error");
        setMessage(
          "No se recibió información de la suscripción de PayPal. " +
          "Por favor verifica que completaste el proceso de aprobación en PayPal."
        );
        return;
      }

      try {
        console.log("Processing subscription callback with ID:", idToUse);
        
        // Activar la suscripción desde el servidor
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
        
        // Mejorar mensajes de error
        let errorMessage = "Error al activar la suscripción";
        
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        // Mensajes más descriptivos según el tipo de error
        if (errorMessage.includes("No barbershop found") || errorMessage.includes("barbería")) {
          errorMessage = "No se encontró la barbería asociada. Por favor contacta al soporte.";
        } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("autenticado")) {
          errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
        } else if (errorMessage.includes("permisos") || errorMessage.includes("owner")) {
          errorMessage = "No tienes permisos para activar esta suscripción. Se requiere ser propietario de la barbería.";
        } else if (errorMessage.includes("PayPal") || errorMessage.includes("paypal")) {
          errorMessage = `Error al comunicarse con PayPal: ${errorMessage}`;
        }

        setMessage(errorMessage);
      }
    };

    processCallback();
  }, [searchParams, activateSubscription, navigate, userDataLoading, hasProcessed, timeoutReached]);

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
