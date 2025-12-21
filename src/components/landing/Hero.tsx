import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck, Users, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { getAppUrl } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function Hero() {
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-background pb-20 pt-32 md:pb-32 md:pt-40">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              {t("hero.badge" as any)}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t("hero.title" as any)}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            {t("hero.subtitle" as any)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                {t("hero.cta" as any)}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/b/demo">{t("hero.demo" as any)}</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-4 md:gap-8"
          >
            <div className="text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-secondary p-3">
                  <CalendarCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
              <p className="mt-3 font-display text-xl font-bold text-foreground md:text-3xl">
                +10,000
              </p>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                {t("hero.stats.appointments" as any)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-secondary p-3">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
              <p className="mt-3 font-display text-xl font-bold text-foreground md:text-3xl">
                +500
              </p>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                {t("hero.stats.barbershops" as any)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-secondary p-3">
                  <Ban className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
              <p className="mt-3 font-display text-xl font-bold text-foreground md:text-3xl">
                {t("hero.stats.no" as any)}
              </p>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                {t("hero.stats.noFees" as any)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
            {/* Browser mockup header */}
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                {dashboardUrl}
              </div>
            </div>
            
            {/* Dashboard content mockup */}
            <div className="bg-background p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-4">
                {/* Stats cards */}
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-sm text-muted-foreground">{t("hero.mockup.todayAppointments" as any)}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">8</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-sm text-muted-foreground">{t("hero.mockup.thisWeek" as any)}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">32</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-sm text-muted-foreground">{t("hero.mockup.monthRevenue" as any)}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">$2,450</p>
                  <span className="text-xs text-green-500">+12%</span>
                </div>
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-sm text-muted-foreground">{t("hero.mockup.newClients" as any)}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">24</p>
                  <span className="text-xs text-green-500">+8</span>
                </div>
              </div>
              
              {/* Table mockup */}
              <div className="mt-4 rounded-xl bg-card border border-border overflow-hidden">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <p className="font-semibold text-foreground">{t("hero.mockup.todayAgenda" as any)}</p>
                  <p className="text-sm text-muted-foreground">{t("hero.mockup.greeting" as any)}</p>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { time: "10:00", client: "Miguel Rodríguez", service: "Corte clásico" },
                    { time: "11:00", client: "Carlos Pérez", service: "Corte + Barba" },
                    { time: "12:00", client: "Juan García", service: "Fade" },
                  ].map((apt, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-primary">{apt.time}</span>
                        <span className="text-foreground">{apt.client}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{apt.service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
