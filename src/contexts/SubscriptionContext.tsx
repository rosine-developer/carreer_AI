import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { isAdminEmail } from '../lib/admin';

type Plan = 'free' | 'pro';

interface SubscriptionContextType {
  plan: Plan;
  isPro: boolean;
  isAdmin: boolean;
  loading: boolean;
  openCheckout: () => void;
  openCustomerPortal: () => void;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// Features locked behind Pro
export const PRO_FEATURES = [
  'Help Me Apply',
  'Resume Builder',
  'Cover Letter',
  'Form Helper',
  'Track Applications',
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(false);

  const CHECKOUT_LINK = import.meta.env.VITE_POLAR_CHECKOUT_LINK;
  const ACCESS_TOKEN = import.meta.env.VITE_POLAR_ACCESS_TOKEN;

  // Check subscription status via Polar API
  const checkSubscription = async () => {
    if (!user || !ACCESS_TOKEN || ACCESS_TOKEN === 'your_polar_access_token_here') {
      setPlan('free');
      return;
    }

    setLoading(true);
    try {
      // Check if user has active subscription using Polar Customer Portal API
      const response = await fetch(
        `https://api.polar.sh/v1/subscriptions?customer_email=${encodeURIComponent(user.email || '')}&active=true`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const hasActiveSub = data.items && data.items.length > 0;
        setPlan(hasActiveSub ? 'pro' : 'free');
        // Cache in localStorage
        if (user.id) {
          localStorage.setItem(`careermind:plan:${user.id}`, hasActiveSub ? 'pro' : 'free');
        }
      }
    } catch (err) {
      console.warn('Could not check subscription:', err);
      // Fall back to cached value
      if (user.id) {
        const cached = localStorage.getItem(`careermind:plan:${user.id}`);
        if (cached === 'pro') setPlan('pro');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Admins always get Pro for free
      if (isAdminEmail(user.email)) {
        setPlan('pro');
        return;
      }
      // Check cached plan first for instant UI
      const cached = localStorage.getItem(`careermind:plan:${user.id}`);
      if (cached === 'pro') setPlan('pro');
      // Then verify with API
      checkSubscription();
    } else {
      setPlan('free');
    }
  }, [user]);

  // Also check when returning from checkout (URL has success param)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('checkout') === 'success') {
      // Remove param from URL
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
      // Refresh subscription after short delay (Polar needs a moment)
      setTimeout(checkSubscription, 2000);
    }
  }, []);

  const openCheckout = () => {
    if (!CHECKOUT_LINK || CHECKOUT_LINK === 'your_polar_checkout_link_here') {
      alert('Payment not configured yet. Please contact support.');
      return;
    }
    // Open Polar checkout in a new tab — most reliable approach
    const successUrl = `${window.location.origin}?checkout=success`;
    const checkoutUrl = `${CHECKOUT_LINK}?success_url=${encodeURIComponent(successUrl)}`;
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  const openCustomerPortal = () => {
    // Polar customer portal — user manages their subscription here
    window.open('https://polar.sh/purchases', '_blank');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isPro: plan === 'pro',
        isAdmin: isAdminEmail(user?.email),
        loading,
        openCheckout,
        openCustomerPortal,
        refreshSubscription: checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}




