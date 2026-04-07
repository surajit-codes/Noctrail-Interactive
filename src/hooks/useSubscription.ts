'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function getClientDb() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const existing = getApps();
  const app = existing.length > 0 ? existing[0]! : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      try {
        const db = getClientDb();
        const subDoc = await getDoc(
          doc(db, 'users', user.uid, 'subscription', 'current')
        );
        if (subDoc.exists()) {
          const data = subDoc.data();
          const isActive = data?.status === 'active';
          const notExpired = new Date(data?.expires_at) > new Date();
          setIsPremium(isActive && notExpired);
          setExpiresAt(data?.expires_at);
        }
      } catch (err) {
        console.error('Subscription check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSubscription();
  }, [user]);

  return { isPremium, isLoading, expiresAt };
};
