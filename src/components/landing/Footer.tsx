import { Logo } from "@/components/layout/Logo";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { Instagram } from "lucide-react";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-background py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo size="sm" />
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="#getting-started"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.gettingStarted" as any)}
            </a>
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.features" as any)}
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.pricing" as any)}
            </a>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.contact" as any)}
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.privacy" as any)}
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.terms" as any)}
            </Link>
            <a
              href="https://www.instagram.com/trimly.it/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram className="h-4 w-4" />
              {t("footer.instagram" as any)}
            </a>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Trimly. {t("footer.copyright" as any)}
          </p>
        </div>
      </div>
    </footer>
  );
}
