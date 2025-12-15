import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Reservas online ilimitadas",
  "Hasta 10 barberos",
  "Recordatorios por email",
  "Página pública personalizada",
  "Panel móvil-first",
  "Reportes de ingresos",
  "Gestión de clientes",
  "Soporte por email",
];

export function Pricing() {
  return (
    <section className="bg-background py-20 md:py-32" id="pricing">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Un precio simple. Sin sorpresas.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Prueba gratis 30 días. Cancela cuando quieras.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-12 max-w-lg"
        >
          <Card variant="elevated" className="relative overflow-hidden border-2 border-primary/20">
            <div className="absolute right-4 top-4">
              <Badge variant="trial">Más popular</Badge>
            </div>
            <CardHeader className="pb-4 pt-8">
              <CardTitle className="font-display text-xl font-semibold">
                Plan Profesional
              </CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-foreground">$10</span>
                <span className="text-lg text-muted-foreground">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Por barbería. Facturación mensual.
              </p>
            </CardHeader>
            <CardContent className="pb-8">
              <ul className="mt-4 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="hero" size="xl" className="mt-8 w-full" asChild>
                <Link to="/register">
                  Comenzar prueba gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                30 días gratis. Sin tarjeta de crédito.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
