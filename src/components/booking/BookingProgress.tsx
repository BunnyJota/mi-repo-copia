import { cn } from "@/lib/utils";

const steps = [
  { number: 1, label: "Servicios" },
  { number: 2, label: "Barbero" },
  { number: 3, label: "Fecha" },
  { number: 4, label: "Datos" },
];

interface BookingProgressProps {
  currentStep: number;
}

export function BookingProgress({ currentStep }: BookingProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.number}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  currentStep >= step.number
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12 transition-all sm:w-20 md:w-28",
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
