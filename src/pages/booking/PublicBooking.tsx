import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ServiceSelection } from "@/components/booking/ServiceSelection";
import { BarberSelection } from "@/components/booking/BarberSelection";
import { DateTimeSelection } from "@/components/booking/DateTimeSelection";
import { ClientForm } from "@/components/booking/ClientForm";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { Logo } from "@/components/layout/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, AlertCircle } from "lucide-react";
import { useBarbershopBySlug, usePublicServices, usePublicStaff, useCreateBooking } from "@/hooks/usePublicBooking";
import { addMinutes } from "date-fns";
import { toast } from "sonner";
import { LanguageToggle, useI18n } from "@/i18n";

export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface SelectedService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface SelectedBarber {
  id: string;
  name: string;
  photoUrl?: string;
  userId?: string;
}

export interface SelectedDateTime {
  date: Date;
  time: string;
  availableStaffUserIds?: string[];
}

export interface ClientData {
  name: string;
  email: string;
  phone?: string;
}

const PublicBooking = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: barbershop, isLoading: barbershopLoading } = useBarbershopBySlug(slug || "");
  const { data: services, isLoading: servicesLoading } = usePublicServices(barbershop?.id);
  const { data: staff, isLoading: staffLoading } = usePublicStaff(barbershop?.id);
  const createBooking = useCreateBooking();
  const { t } = useI18n();

  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<SelectedBarber | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<SelectedDateTime | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const isLoading = barbershopLoading || servicesLoading || staffLoading;

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as BookingStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BookingStep);
    }
  };

  const handleConfirmBooking = async (data: ClientData) => {
    if (!barbershop || !selectedDateTime || !selectedBarber) return;

    // Demo mode - don't create real booking
    const isDemo = barbershop.id === "demo-barbershop-id";
    
    if (isDemo) {
      // Simulate booking creation for demo
      setClientData(data);
      setBookingId("demo-booking-id");
      setCurrentStep(5);
      toast.success(t("booking.public.demoToast" as any));
      return;
    }

    // Determine which staff member to assign
    let staffUserId = selectedBarber.userId;
    
    if (selectedBarber.id === "any" && staff && staff.length > 0) {
      // Try to use an actually available staff for the chosen slot
      if (selectedDateTime.availableStaffUserIds && selectedDateTime.availableStaffUserIds.length > 0) {
        staffUserId = selectedDateTime.availableStaffUserIds[0];
      } else {
        // Fallback: first active staff
        staffUserId = staff[0].user_id;
      }
    }

    if (!staffUserId) {
      toast.error(t("booking.public.assignBarberError" as any));
      return;
    }

    // Create start and end times
    const [hours, minutes] = selectedDateTime.time.split(":").map(Number);
    const startAt = new Date(selectedDateTime.date);
    startAt.setHours(hours, minutes, 0, 0);
    const endAt = addMinutes(startAt, totalDuration);

    try {
      const result = await createBooking.mutateAsync({
        barbershopId: barbershop.id,
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        staffUserId,
        serviceIds: selectedServices.map((s) => s.id),
        startAt,
        endAt,
        totalPrice,
      });

      setClientData(data);
      setBookingId(result.id);
      setCurrentStep(5);
      toast.success(t("booking.public.bookingSuccess" as any));
    } catch (error) {
      console.error("Error creating booking:", error);
      const message =
        error instanceof Error
          ? error.message
          : t("booking.public.bookingError" as any);
      toast.error(message);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-sunken">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="container py-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show not found state
  if (!barbershop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-sunken p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("booking.public.notFoundTitle" as any)}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("booking.public.notFoundSubtitle" as any)}
          </p>
        </div>
      </div>
    );
  }

  const isDemo = barbershop.id === "demo-barbershop-id";

  return (
    <div className="min-h-screen bg-surface-sunken">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="font-display text-lg font-semibold">{barbershop.name}</span>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto max-w-2xl">
          {/* Demo banner */}
          {isDemo && (
            <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm font-medium text-primary">
                {t("booking.public.demoTitle" as any)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("booking.public.demoSubtitle" as any)}
              </p>
            </div>
          )}

          {/* Barbershop info */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {barbershop.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{barbershop.address}</span>
              </div>
            )}
            {barbershop.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <span>{barbershop.phone}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {currentStep < 5 && (
            <BookingProgress currentStep={currentStep} />
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <ServiceSelection
                  services={services || []}
                  selectedServices={selectedServices}
                  onServicesChange={setSelectedServices}
                  onNext={handleNextStep}
                  barbershop={barbershop}
                />
              )}
              {currentStep === 2 && (
                <BarberSelection
                  staff={staff || []}
                  selectedBarber={selectedBarber}
                  onBarberChange={setSelectedBarber}
                  onNext={handleNextStep}
                  onBack={handlePrevStep}
                />
              )}
              {currentStep === 3 && (
                <DateTimeSelection
                  barbershop={barbershop}
                  staff={staff || []}
                  selectedBarber={selectedBarber}
                  selectedDateTime={selectedDateTime}
                  onDateTimeChange={setSelectedDateTime}
                  totalDuration={totalDuration}
                  onNext={handleNextStep}
                  onBack={handlePrevStep}
                />
              )}
              {currentStep === 4 && (
                <ClientForm
                  selectedServices={selectedServices}
                  selectedBarber={selectedBarber}
                  selectedDateTime={selectedDateTime}
                  totalPrice={totalPrice}
                  barbershop={barbershop}
                  onConfirm={handleConfirmBooking}
                  onBack={handlePrevStep}
                  isSubmitting={createBooking.isPending}
                />
              )}
              {currentStep === 5 && clientData && (
                <BookingConfirmation
                  barbershopName={barbershop.name}
                  barbershop={barbershop}
                  clientData={clientData}
                  selectedServices={selectedServices}
                  selectedBarber={selectedBarber}
                  selectedDateTime={selectedDateTime}
                  totalPrice={totalPrice}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default PublicBooking;
