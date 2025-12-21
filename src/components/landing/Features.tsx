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
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  const features = [
    {
      icon: CalendarClock,
      titleKey: "features.onlineBookings.title",
      descriptionKey: "features.onlineBookings.description",
    },
    {
      icon: Zap,
      titleKey: "features.smartAvailability.title",
      descriptionKey: "features.smartAvailability.description",
    },
    {
      icon: Users,
      titleKey: "features.staffManagement.title",
      descriptionKey: "features.staffManagement.description",
    },
    {
      icon: Smartphone,
      titleKey: "features.mobileFirst.title",
      descriptionKey: "features.mobileFirst.description",
    },
    {
      icon: Bell,
      titleKey: "features.automaticReminders.title",
      descriptionKey: "features.automaticReminders.description",
    },
    {
      icon: BarChart3,
      titleKey: "features.clearReports.title",
      descriptionKey: "features.clearReports.description",
    },
    {
      icon: BadgeDollarSign,
      titleKey: "features.noCommissions.title",
      descriptionKey: "features.noCommissions.description",
    },
    {
      icon: Link2,
      titleKey: "features.customBrand.title",
      descriptionKey: "features.customBrand.description",
    },
  ];

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
            {t("features.title" as any)}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            {t("features.subtitle" as any)}
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card variant="interactive" className="h-full">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {t(feature.titleKey as any)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(feature.descriptionKey as any)}
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
