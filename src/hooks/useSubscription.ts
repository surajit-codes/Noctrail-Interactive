'use client';

import { useAuth } from '@/context/AuthContext';

export const useSubscription = () => {
  const { isPremium, loadingPremium } = useAuth();
  
  return { 
    isPremium, 
    isLoading: loadingPremium, 
    expiresAt: null // Retained for backwards compatibility if needed
  };
};
