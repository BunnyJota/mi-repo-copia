import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { Menu, X } from "lucide-react";
import { LanguageToggle, useI18n } from "@/i18n";

const navLinks = [
  { href: "#getting-started", labelKey: "nav.gettingStarted" },
  { href: "#features", labelKey: "nav.features" },
  { href: "#pricing", labelKey: "nav.pricing" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="z-50">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.labelKey as any)}
            </a>
          ))}
          <LanguageToggle />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/login">{t("nav.login" as any)}</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/register">{t("nav.register" as any)}</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="z-50 p-2 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background md:hidden"
            >
              <div className="flex h-full flex-col items-center justify-center gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="font-display text-2xl font-semibold text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(link.labelKey as any)}
                  </a>
                ))}
                <div className="mt-8 flex flex-col gap-4">
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.login" as any)}
                    </Link>
                  </Button>
                  <Button variant="default" size="lg" asChild>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.register" as any)}
                    </Link>
                  </Button>
                  <div className="flex justify-center">
                    <LanguageToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
