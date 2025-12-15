import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarClock, 
  Smartphone, 
  Bell, 
  BadgeDollarSign, 
  BarChart3, 
  Link2,
  Zap,
  Users
} from "lucide-react";

const features = [
  {
    icon: CalendarClock,
    title: "Reservas Online 24/7",
    description: "Tus clientes pueden reservar en cualquier momento. Sin llamadas, sin esperas.",
  },
  {
    icon: Zap,
    title: "Disponibilidad Inteligente",
    description: "Motor de slots que evita solapes y respeta tus horarios automáticamente.",
  },
  {
    icon: Users,
    title: "Gestión de Staff",
    description: "Cada barbero ve su agenda. Asigna servicios y controla disponibilidad.",
  },
  {
    icon: Smartphone,
    title: "Móvil First",
    description: "Panel optimizado para operar desde tu celular. Rápido y sin fricciones.",
  },
  {
    icon: Bell,
    title: "Recordatorios Automáticos",
    description: "Emails 24h y 2h antes. Reduce no-shows hasta un 70%.",
  },
  {
    icon: BarChart3,
    title: "Reportes Claros",
    description: "Ingresos por barbero, por servicio. Exporta a CSV cuando quieras.",
  },
  {
    icon: BadgeDollarSign,
    title: "Sin Comisiones",
    description: "Cobra en efectivo o tarjeta. Nosotros no tocamos tu dinero.",
  },
  {
    icon: Link2,
    title: "Tu Marca, Tu Link",
    description: "Página pública personalizada con tu logo y colores. trimly.app/tu-barberia",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section className="bg-surface-sunken py-20 md:py-32" id="features">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Todo lo que necesitas para crecer
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Herramientas diseñadas específicamente para barberías. Simples, potentes y siempre disponibles.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card variant="interactive" className="h-full">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
