import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { supabase } from "@/integrations/supabase/client";

type ConfirmStatus = "loading" | "success" | "canceled" | "error" | "expired" | "already_processed";

const ConfirmAppointment = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const action = searchParams.get("action") === "cancel" ? "cancel" : "confirm";
  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [message, setMessage] = useState("");
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  useEffect(() => {
    const processConfirmation = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token no proporcionado");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("confirm-appointment", {
          body: { token, action },
        });

        if (error) {
          console.error("Error:", error);
          setStatus("error");
          setMessage("Error al procesar la solicitud");
          return;
        }

        if (data.error) {
          switch (data.error) {
            case "expired":
              setStatus("expired");
              break;
            case "already_processed":
              setStatus("already_processed");
              setExistingStatus(data.status);
              break;
            case "used":
              setStatus("already_processed");
              break;
            default:
              setStatus("error");
          }
          setMessage(data.message);
          return;
        }

        setStatus(action === "confirm" ? "success" : "canceled");
        setMessage(data.message);
      } catch (err) {
        console.error("Error processing confirmation:", err);
        setStatus("error");
        setMessage("Error de conexión");
      }
    };

    processConfirmation();
  }, [token, action]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h2 className="font-display text-xl font-semibold">
              {action === "confirm" ? "Confirmando tu cita..." : "Cancelando tu cita..."}
            </h2>
            <p className="text-muted-foreground">Por favor espera un momento</p>
          </div>
        );

      case "success":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold text-success">
              ¡Cita Confirmada!
            </h2>
            <p className="text-center text-muted-foreground">
              Tu cita ha sido confirmada exitosamente. Te esperamos en la fecha y hora indicadas.
            </p>
          </motion.div>
        );

      case "canceled":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="font-display text-2xl font-bold text-destructive">
              Cita Cancelada
            </h2>
            <p className="text-center text-muted-foreground">
              Tu cita ha sido cancelada. Puedes reservar una nueva cita cuando lo desees.
            </p>
          </motion.div>
        );

      case "expired":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-10 w-10 text-warning" />
            </div>
            <h2 className="font-display text-2xl font-bold text-warning">
              Enlace Expirado
            </h2>
            <p className="text-center text-muted-foreground">
              Este enlace ha expirado. Por favor contacta a la barbería para gestionar tu cita.
            </p>
          </motion.div>
        );

      case "already_processed":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-muted-foreground">
              Ya Procesado
            </h2>
            <p className="text-center text-muted-foreground">
              {message || `Esta cita ya fue ${existingStatus === "confirmed" ? "confirmada" : "procesada"} anteriormente.`}
            </p>
          </motion.div>
        );

      case "error":
      default:
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="font-display text-2xl font-bold text-destructive">
              Error
            </h2>
            <p className="text-center text-muted-foreground">
              {message || "No pudimos procesar tu solicitud. Por favor intenta de nuevo."}
            </p>
          </motion.div>
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
                  onClick={() => navigate("/")}
                >
                  Ir al inicio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ConfirmAppointment;