export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "inactive";

export interface SubscriptionLike {
  status: SubscriptionStatus;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
}

export interface SubscriptionAccess {
  isActive: boolean;
  isTrial: boolean;
  isTrialExpired: boolean;
  isTrialEndingToday: boolean;
  isPaymentRequired: boolean;
  canWrite: boolean;
  trialDaysRemaining: number | null;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function getSubscriptionAccess(subscription: SubscriptionLike | null): SubscriptionAccess {
  if (!subscription) {
    return {
      isActive: false,
      isTrial: false,
      isTrialExpired: false,
      isTrialEndingToday: false,
      isPaymentRequired: true,
      canWrite: false,
      trialDaysRemaining: null,
    };
  }

  const now = new Date();
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const isTrial = subscription.status === "trial";
  const isTrialExpired = isTrial && trialEndsAt ? trialEndsAt.getTime() <= now.getTime() : false;
  const isTrialEndingToday = isTrial && trialEndsAt ? isSameDay(trialEndsAt, now) : false;
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS))
    : null;

  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  const isWithinPaidPeriod = currentPeriodEnd ? currentPeriodEnd.getTime() > now.getTime() : false;

  const isActive =
    subscription.status === "active" ||
    (subscription.status === "canceled" && isWithinPaidPeriod);

  const isPaymentRequired =
    subscription.status === "past_due" ||
    subscription.status === "inactive" ||
    (subscription.status === "canceled" && !isWithinPaidPeriod) ||
    isTrialExpired;

  const canWrite = isActive || (isTrial && !isTrialExpired);

  return {
    isActive,
    isTrial,
    isTrialExpired,
    isTrialEndingToday,
    isPaymentRequired,
    canWrite,
    trialDaysRemaining,
  };
}
