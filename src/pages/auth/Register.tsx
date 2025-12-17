import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getAppUrl } from "@/lib/utils";

const Register = () => {
  const basePublicBookingUrl = `${getAppUrl()}/b/`;
  const [step, setStep] = useState<"user" | "barbershop">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [barbershopName, setBarbershopName] = useState("");
  const [slug, setSlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleBarbershopNameChange = (value: string) => {
    setBarbershopName(value);
    setSlug(generateSlug(value));
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !displayName) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setStep("barbershop");
  };

  const handleBarbershopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barbershopName || !slug) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    // First, sign up the user
    const { error: signUpError } = await signUp(email, password, displayName);
    
    if (signUpError) {
      setLoading(false);
      console.error("Sign up error:", signUpError);
      if (signUpError.message.includes("already registered")) {
        toast.error("Este email ya está registrado");
      } else {
        toast.error(signUpError.message);
      }
      return;
    }

    // Verifica si Supabase exige confirmación por email: si no hay sesión, detenemos el flujo
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setNeedsEmailVerification(true);
      setLoading(false);
      toast("Revisa tu correo", {
        description: "Te enviamos un enlace para confirmar tu cuenta. Luego inicia sesión.",
      });
      return;
    }

    // Wait a bit for the user to be created and profile trigger to run
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      toast.error("Error al crear la cuenta");
      return;
    }

    // Create the barbershop
    const { data: barbershop, error: barbershopError } = await supabase
      .from("barbershops")
      .insert({
        name: barbershopName,
        slug: slug,
      })
      .select()
      .single();

    if (barbershopError) {
      setLoading(false);
      console.error("Barbershop insert error:", barbershopError);
      if (barbershopError.message.includes("duplicate")) {
        toast.error("Este nombre de URL ya está en uso. Elige otro.");
      } else {
        toast.error("Error al crear la barbería: " + barbershopError.message);
      }
      return;
    }

    // Update the profile with the barbershop_id
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ barbershop_id: barbershop.id })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Assign the owner role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "owner",
      });

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    // Create default availability rules (Mon-Sat 10:00-20:00)
    const defaultRules = [1, 2, 3, 4, 5, 6].map((day) => ({
      barbershop_id: barbershop.id,
      day_of_week: day,
      open_time: "10:00:00",
      close_time: "20:00:00",
      is_enabled: true,
    }));

    await supabase.from("availability_rules").insert(defaultRules);

    // Create the subscription with 30-day trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    await supabase.from("subscriptions").insert({
      barbershop_id: barbershop.id,
      status: "trial",
      trial_ends_at: trialEndsAt.toISOString(),
    });

    setLoading(false);
    toast.success("¡Barbería creada con éxito!");
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === "user" ? "Crea tu cuenta" : "Tu barbería"}
            </CardTitle>
            <CardDescription>
              {step === "user"
                ? "Paso 1 de 2: Datos personales"
                : "Paso 2 de 2: Configura tu barbería"}
            </CardDescription>
            {needsEmailVerification && (
              <p className="mt-2 text-sm text-primary">
                Revisa tu correo y confirma tu cuenta. Luego inicia sesión para continuar.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {step === "user" ? (
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Tu nombre</Label>
                  <Input
                    id="displayName"
                    placeholder="Juan Pérez"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Continuar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleBarbershopSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barbershopName">Nombre de la barbería</Label>
                  <Input
                    id="barbershopName"
                    placeholder="The Classic Barber"
                    value={barbershopName}
                    onChange={(e) => handleBarbershopNameChange(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL de reservas</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {basePublicBookingUrl}
                    </span>
                    <Input
                      id="slug"
                      placeholder="the-classic-barber"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={loading}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este será el link que compartirás con tus clientes
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep("user")}
                    disabled={loading}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear barbería"
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
