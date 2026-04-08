'use client';

import { useAuth } from '@/context/AuthContext';

export const useSubscription = () => {
  const { isPremium, loadingPremium, expiresAt } = useAuth();
  
  return { 
    isPremium, 
    isLoading: loadingPremium, 
    expiresAt
  };
};
