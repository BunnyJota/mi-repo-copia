import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Store,
  Scissors,
  Users,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";

const steps = [
  {
    icon: Store,
    titleKey: "tutorial.steps.brand.title",
    bodyKey: "tutorial.steps.brand.body",
    previewTitleKey: "tutorial.steps.brand.preview.title",
    previewRows: [
      { labelKey: "tutorial.steps.brand.preview.logo", valueKey: "tutorial.steps.brand.preview.logoValue" },
      { labelKey: "tutorial.steps.brand.preview.color", valueKey: "tutorial.steps.brand.preview.colorValue" },
      { labelKey: "tutorial.steps.brand.preview.hours", valueKey: "tutorial.steps.brand.preview.hoursValue" },
    ],
  },
  {
    icon: Scissors,
    titleKey: "tutorial.steps.services.title",
    bodyKey: "tutorial.steps.services.body",
    previewTitleKey: "tutorial.steps.services.preview.title",
    previewRows: [
      { labelKey: "tutorial.steps.services.preview.service1", valueKey: "tutorial.steps.services.preview.service1Value" },
      { labelKey: "tutorial.steps.services.preview.service2", valueKey: "tutorial.steps.services.preview.service2Value" },
      { labelKey: "tutorial.steps.services.preview.service3", valueKey: "tutorial.steps.services.preview.service3Value" },
    ],
  },
  {
    icon: Users,
    titleKey: "tutorial.steps.team.title",
    bodyKey: "tutorial.steps.team.body",
    previewTitleKey: "tutorial.steps.team.preview.title",
    previewRows: [
      { labelKey: "tutorial.steps.team.preview.member1", valueKey: "tutorial.steps.team.preview.member1Value" },
      { labelKey: "tutorial.steps.team.preview.member2", valueKey: "tutorial.steps.team.preview.member2Value" },
      { labelKey: "tutorial.steps.team.preview.member3", valueKey: "tutorial.steps.team.preview.member3Value" },
    ],
  },
  {
    icon: Bell,
    titleKey: "tutorial.steps.notifications.title",
    bodyKey: "tutorial.steps.notifications.body",
    previewTitleKey: "tutorial.steps.notifications.preview.title",
    previewRows: [
      { labelKey: "tutorial.steps.notifications.preview.item1", valueKey: "tutorial.steps.notifications.preview.item1Value" },
      { labelKey: "tutorial.steps.notifications.preview.item2", valueKey: "tutorial.steps.notifications.preview.item2Value" },
      { labelKey: "tutorial.steps.notifications.preview.item3", valueKey: "tutorial.steps.notifications.preview.item3Value" },
    ],
  },
];

const quickWins = [
  { icon: CalendarCheck, titleKey: "tutorial.quickWins.bookings.title", bodyKey: "tutorial.quickWins.bookings.body" },
  { icon: ShieldCheck, titleKey: "tutorial.quickWins.policies.title", bodyKey: "tutorial.quickWins.policies.body" },
  { icon: Sparkles, titleKey: "tutorial.quickWins.branding.title", bodyKey: "tutorial.quickWins.branding.body" },
];

export function GettingStarted() {
  const { t } = useI18n();

  return (
    <section className="bg-background py-20 md:py-32" id="getting-started">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
          >
            <Sparkles className="h-4 w-4" />
            {t("tutorial.badge" as any)}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("tutorial.title" as any)}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            {t("tutorial.subtitle" as any)}
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * index }}
              >
                <Card variant="interactive" className="border border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                          {t("tutorial.stepLabel" as any).replace("{number}", String(index + 1))}
                        </p>
                        <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                          {t(step.titleKey as any)}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t(step.bodyKey as any)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(step.previewTitleKey as any)}
                      </p>
                      <div className="mt-3 space-y-2">
                        {step.previewRows.map((row) => (
                          <div
                            key={row.labelKey}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
                          >
                            <span className="text-xs text-muted-foreground">{t(row.labelKey as any)}</span>
                            <span className="text-xs font-medium text-foreground">{t(row.valueKey as any)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" />
            <Card className="relative overflow-hidden border border-border/60 bg-card shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
                <div className="flex h-2 w-2 rounded-full bg-primary" />
                <div className="text-xs text-muted-foreground">
                  {t("tutorial.mockup.header" as any)}
                </div>
              </div>
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("tutorial.mockup.title" as any)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tutorial.mockup.subtitle" as any)}
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    "tutorial.mockup.checklist.profile",
                    "tutorial.mockup.checklist.services",
                    "tutorial.mockup.checklist.team",
                    "tutorial.mockup.checklist.notifications",
                  ].map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-foreground">{t(key as any)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("tutorial.mockup.checklist.status" as any)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {t("tutorial.mockup.tip" as any)}
                </div>
                <Button variant="hero" className="w-full" asChild>
                  <Link to="/register">
                    {t("tutorial.mockup.cta" as any)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3"
        >
          {quickWins.map((item) => (
            <Card key={item.titleKey} className="border border-border/60">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {t(item.titleKey as any)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(item.bodyKey as any)}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
