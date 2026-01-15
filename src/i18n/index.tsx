import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";

type Lang = "es" | "en";

type Dictionary = Record<string, string>;

const translations: Record<Lang, Dictionary> = {
  es: {
    "nav.features": "Funciones",
    "nav.pricing": "Precios",
    "nav.login": "Iniciar sesión",
    "nav.register": "Registrar barbería",

    "hero.badge": "La plataforma #1 para barberías",
    "hero.title": "Gestiona tu barbería. Sin complicaciones.",
    "hero.subtitle":
      "Reservas online, agenda inteligente y cobros automáticos. Todo lo que necesitas para hacer crecer tu negocio en una sola plataforma.",
    "hero.cta": "Prueba gratis 30 días",
    "hero.demo": "Ver demo",
    "hero.stats.appointments": "citas/mes",
    "hero.stats.barbershops": "barberías",
    "hero.stats.noFees": "Sin comisiones",
    "hero.stats.no": "Sin",
    "hero.mockup.todayAppointments": "Citas hoy",
    "hero.mockup.thisWeek": "Esta semana",
    "hero.mockup.monthRevenue": "Ingresos mes",
    "hero.mockup.newClients": "Clientes nuevos",
    "hero.mockup.todayAgenda": "Agenda de hoy",
    "hero.mockup.greeting": "Buenos días, Carlos",

    "features.title": "Todo lo que necesitas para crecer",
    "features.subtitle": "Herramientas diseñadas específicamente para barberías. Simples, potentes y siempre disponibles.",
    "features.onlineBookings.title": "Reservas Online 24/7",
    "features.onlineBookings.description": "Tus clientes pueden reservar en cualquier momento. Sin llamadas, sin esperas.",
    "features.smartAvailability.title": "Disponibilidad Inteligente",
    "features.smartAvailability.description": "Motor de slots que evita solapes y respeta tus horarios automáticamente.",
    "features.staffManagement.title": "Gestión de Staff",
    "features.staffManagement.description": "Cada barbero ve su agenda. Asigna servicios y controla disponibilidad.",
    "features.mobileFirst.title": "Móvil First",
    "features.mobileFirst.description": "Panel optimizado para operar desde tu celular. Rápido y sin fricciones.",
    "features.automaticReminders.title": "Recordatorios Automáticos",
    "features.automaticReminders.description": "Emails 24h y 2h antes. Reduce no-shows hasta un 70%.",
    "features.clearReports.title": "Reportes Claros",
    "features.clearReports.description": "Ingresos por barbero, por servicio. Exporta a CSV cuando quieras.",
    "features.noCommissions.title": "Sin Comisiones",
    "features.noCommissions.description": "Cobra en efectivo o tarjeta. Nosotros no tocamos tu dinero.",
    "features.customBrand.title": "Tu Marca, Tu Link",
    "features.customBrand.description": "Página pública personalizada con tu logo y colores, lista para compartir.",

    "pricing.title": "Un precio simple. Sin sorpresas.",
    "pricing.subtitle": "Prueba gratis 30 días. Cancela cuando quieras.",
    "pricing.mostPopular": "Más popular",
    "pricing.planName": "Plan Profesional",
    "pricing.perMonth": "/mes",
    "pricing.billing": "Por barbería. Facturación mensual.",
    "pricing.feature.unlimitedBookings": "Reservas online ilimitadas",
    "pricing.feature.upTo10Barbers": "Hasta 10 barberos",
    "pricing.feature.emailReminders": "Recordatorios por email",
    "pricing.feature.customPage": "Página pública personalizada",
    "pricing.feature.mobilePanel": "Panel móvil-first",
    "pricing.feature.revenueReports": "Reportes de ingresos",
    "pricing.feature.clientManagement": "Gestión de clientes",
    "pricing.feature.emailSupport": "Soporte por email",
    "pricing.cta": "Comenzar prueba gratis",
    "pricing.trialNote": "30 días gratis. Sin tarjeta de crédito.",

    "footer.features": "Características",
    "footer.pricing": "Precios",
    "footer.contact": "Contacto",
    "footer.privacy": "Privacidad",
    "footer.terms": "Términos",
    "footer.copyright": "Todos los derechos reservados.",

    "service.title": "¿Qué servicio necesitas?",
    "service.subtitle": "Selecciona uno o más servicios",
    "service.empty": "No hay servicios disponibles en este momento.",
    "service.total": "Total",
    "service.continue": "Continuar",
    "service.selected": "servicio(s)",

    "booking.confirmed": "Cita agendada",
    "booking.scheduled": "Cita agendada",
    "booking.confirmButton": "Agendar cita",
    "booking.sentTo": "Hemos enviado los detalles a",
    "booking.at": "Reserva en",
    "booking.barber": "Tu barbero",
    "booking.services": "Servicios",
    "booking.duration": "Duración estimada",
    "booking.totalToPay": "Total a pagar",
    "booking.payOnSite": "Pago en el local",
    "booking.checkEmail": "Revisa tu email para gestionar tu cita",
    "booking.backHome": "Volver al inicio",
  },
  en: {
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.register": "Register barbershop",

    "hero.badge": "#1 platform for barbershops",
    "hero.title": "Run your barbershop. No hassle.",
    "hero.subtitle":
      "Online bookings, smart scheduling and payments. Everything you need to grow your business in one platform.",
    "hero.cta": "Try free for 30 days",
    "hero.demo": "See demo",
    "hero.stats.appointments": "appointments/month",
    "hero.stats.barbershops": "barbershops",
    "hero.stats.noFees": "No fees",
    "hero.stats.no": "No",
    "hero.mockup.todayAppointments": "Today's appointments",
    "hero.mockup.thisWeek": "This week",
    "hero.mockup.monthRevenue": "Month revenue",
    "hero.mockup.newClients": "New clients",
    "hero.mockup.todayAgenda": "Today's agenda",
    "hero.mockup.greeting": "Good morning, Carlos",

    "features.title": "Everything you need to grow",
    "features.subtitle": "Tools designed specifically for barbershops. Simple, powerful and always available.",
    "features.onlineBookings.title": "24/7 Online Bookings",
    "features.onlineBookings.description": "Your clients can book anytime. No calls, no waiting.",
    "features.smartAvailability.title": "Smart Availability",
    "features.smartAvailability.description": "Slot engine that prevents overlaps and automatically respects your schedule.",
    "features.staffManagement.title": "Staff Management",
    "features.staffManagement.description": "Each barber sees their schedule. Assign services and control availability.",
    "features.mobileFirst.title": "Mobile First",
    "features.mobileFirst.description": "Panel optimized to operate from your phone. Fast and frictionless.",
    "features.automaticReminders.title": "Automatic Reminders",
    "features.automaticReminders.description": "Emails 24h and 2h before. Reduces no-shows by up to 70%.",
    "features.clearReports.title": "Clear Reports",
    "features.clearReports.description": "Revenue by barber, by service. Export to CSV whenever you want.",
    "features.noCommissions.title": "No Commissions",
    "features.noCommissions.description": "Collect cash or card. We don't touch your money.",
    "features.customBrand.title": "Your Brand, Your Link",
    "features.customBrand.description": "Customized public page with your logo and colors, ready to share.",

    "pricing.title": "One simple price. No surprises.",
    "pricing.subtitle": "Free 30-day trial. Cancel anytime.",
    "pricing.mostPopular": "Most popular",
    "pricing.planName": "Professional Plan",
    "pricing.perMonth": "/month",
    "pricing.billing": "Per barbershop. Monthly billing.",
    "pricing.feature.unlimitedBookings": "Unlimited online bookings",
    "pricing.feature.upTo10Barbers": "Up to 10 barbers",
    "pricing.feature.emailReminders": "Email reminders",
    "pricing.feature.customPage": "Customized public page",
    "pricing.feature.mobilePanel": "Mobile-first panel",
    "pricing.feature.revenueReports": "Revenue reports",
    "pricing.feature.clientManagement": "Client management",
    "pricing.feature.emailSupport": "Email support",
    "pricing.cta": "Start free trial",
    "pricing.trialNote": "30 days free. No credit card required.",

    "footer.features": "Features",
    "footer.pricing": "Pricing",
    "footer.contact": "Contact",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.copyright": "All rights reserved.",

    "service.title": "Which service do you need?",
    "service.subtitle": "Select one or more services",
    "service.empty": "No services available right now.",
    "service.total": "Total",
    "service.continue": "Continue",
    "service.selected": "service(s)",

    "booking.confirmed": "Appointment scheduled",
    "booking.scheduled": "Appointment scheduled",
    "booking.confirmButton": "Schedule appointment",
    "booking.sentTo": "We sent the details to",
    "booking.at": "Booking at",
    "booking.barber": "Your barber",
    "booking.services": "Services",
    "booking.duration": "Estimated duration",
    "booking.totalToPay": "Total to pay",
    "booking.payOnSite": "Pay at the shop",
    "booking.checkEmail": "Check your email to manage your booking",
    "booking.backHome": "Back to home",
  },
};

type I18nContextType = {
  lang: Lang;
  t: (key: keyof typeof translations["es"]) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (stored === "es" || stored === "en") {
      setLangState(stored);
    } else if (typeof navigator !== "undefined") {
      const navLang = navigator.language.startsWith("en") ? "en" : "es";
      setLangState(navLang);
    }
  }, []);

  const setLang = (value: Lang) => {
    setLangState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", value);
    }
  };

  const t = useMemo(() => {
    return (key: keyof typeof translations["es"]) => translations[lang]?.[key] ?? translations["es"][key] ?? key;
  }, [lang]);

  const value = useMemo(() => {
    return { lang, t, setLang };
  }, [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
};

export const LanguageToggle = () => {
  const { lang, setLang } = useI18n();
  const next = lang === "es" ? "en" : "es";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {lang.toUpperCase()}
    </button>
  );
};
