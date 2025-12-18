import { cn } from "@/lib/utils";
import TrimlyLogo from "@/assets/trimly-logo.svg";

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
        <img
          src={TrimlyLogo}
          alt="Trimly"
          className="h-9 w-9 rounded-lg object-contain"
        />
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight", sizes[size].text)}>
          Trimly
        </span>
      )}
    </div>
  );
}
