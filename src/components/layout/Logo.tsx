import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: "text-lg" },
    md: { icon: 24, text: "text-xl" },
    lg: { icon: 32, text: "text-2xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Scissors className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight", sizes[size].text)}>
          Mi Plataforma
        </span>
      )}
    </div>
  );
}
