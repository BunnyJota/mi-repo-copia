import { Logo } from "@/components/layout/Logo";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo size="sm" />
          
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Características
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Precios
            </a>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contacto
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacidad
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Términos
            </Link>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Trimly. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
