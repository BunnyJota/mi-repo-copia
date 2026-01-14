import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import PublicBooking from "./pages/booking/PublicBooking";
import ManageAppointment from "./pages/booking/ManageAppointment";
import ConfirmAppointment from "./pages/booking/ConfirmAppointment";
import Dashboard from "./pages/dashboard/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import EmailConfirmed from "./pages/auth/EmailConfirmed";
import SubscriptionCallback from "./pages/subscription/SubscriptionCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/email-confirmed" element={<EmailConfirmed />} />
            <Route path="/b/:slug" element={<PublicBooking />} />
            <Route path="/m/:token" element={<ManageAppointment />} />
            <Route path="/confirm/:token" element={<ConfirmAppointment />} />
            <Route
              path="/subscription/callback"
              element={
                <ProtectedRoute>
                  <SubscriptionCallback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
