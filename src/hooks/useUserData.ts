import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSubscriptionAccess } from "@/lib/subscription";

export interface UserProfile {
  id: string;
  user_id: string;
  barbershop_id: string | null;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  is_active: boolean;
}

export interface Barbershop {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency?: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  brand_accent: string;
  is_active: boolean;
  slot_interval_minutes: number;
  buffer_minutes: number;
  booking_window_days: number;
  min_advance_hours: number;
}

export interface Subscription {
  id: string;
  barbershop_id: string;
  status: "trial" | "active" | "past_due" | "canceled" | "inactive";
  trial_started_at?: string | null;
  trial_ends_at: string | null;
  paypal_plan_id: string | null;
  paypal_subscription_id: string | null;
  current_period_end: string | null;
  last_payment_at?: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "owner" | "manager" | "barber" | "super_admin";
}

export function useUserData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setBarbershop(null);
      setSubscription(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as UserProfile);

        // Fetch barbershop if profile has one
        if (profileData.barbershop_id) {
          const { data: barbershopData } = await supabase
            .from("barbershops")
            .select("*")
            .eq("id", profileData.barbershop_id)
            .single();

          if (barbershopData) {
            setBarbershop(barbershopData as Barbershop);

            // Fetch subscription
            const { data: subscriptionData } = await supabase
              .from("subscriptions")
              .select("*")
              .eq("barbershop_id", profileData.barbershop_id)
              .single();

            if (subscriptionData) {
              setSubscription(subscriptionData as Subscription);
            }
          }
        }
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (rolesData) {
        setRoles(rolesData as UserRole[]);
      }

      setLoading(false);
    };

    fetchData();

    // Set up real-time subscription for barbershop changes (including currency)
    if (profile?.barbershop_id) {
      const channel = supabase
        .channel(`barbershop-${profile.barbershop_id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "barbershops",
            filter: `id=eq.${profile.barbershop_id}`,
          },
          (payload) => {
            // Update barbershop data when it changes
            setBarbershop(payload.new as Barbershop);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile?.barbershop_id]);

  const hasRole = (role: UserRole["role"]) => {
    return roles.some((r) => r.role === role);
  };

  const isOwner = hasRole("owner");
  const isManager = hasRole("manager");
  const isBarber = hasRole("barber");
  const isSuperAdmin = hasRole("super_admin");

  const subscriptionAccess = getSubscriptionAccess(subscription);

  return {
    profile,
    barbershop,
    subscription,
    roles,
    loading,
    hasRole,
    isOwner,
    isManager,
    isBarber,
    isSuperAdmin,
    trialDaysRemaining: subscriptionAccess.trialDaysRemaining,
    subscriptionAccess,
  };
}
