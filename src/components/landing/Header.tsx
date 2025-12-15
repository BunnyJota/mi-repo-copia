import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Funciones" },
  { href: "#pricing", label: "Precios" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/register">Registrar barbería</Link>
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
                    {link.label}
                  </a>
                ))}
                <div className="mt-8 flex flex-col gap-4">
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Iniciar sesión
                    </Link>
                  </Button>
                  <Button variant="default" size="lg" asChild>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      Registrar barbería
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
