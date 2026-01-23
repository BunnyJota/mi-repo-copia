import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";

const EmailConfirmed = () => {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-center">
          <Logo />
        </div>
      </header>

      <main className="container flex flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("auth.emailConfirmed.title" as any)}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.emailConfirmed.subtitle" as any)}
            </p>
            <div className="flex gap-3 mt-4">
              <Button asChild variant="outline">
                <Link to="/">{t("auth.emailConfirmed.backHome" as any)}</Link>
              </Button>
              <Button asChild>
                <Link to="/login">{t("auth.emailConfirmed.login" as any)}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmailConfirmed;
