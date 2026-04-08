"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, googleProvider, getDailyBriefingByDate } from "@/lib/firebaseClient";
import { getFirestore } from "firebase/firestore";
import { getApps, initializeApp } from "firebase/app";

// Re-use logic since getDb isn't exported from firebaseClient.ts
// Usually we'd export it, but doing it here prevents circular dependency issues.

function getLocalDb() {
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  loadingPremium: boolean;
  expiresAt: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  loadingPremium: true,
  expiresAt: null,
  signInWithGoogle: async () => {},
  signUpWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    // We import onSnapshot dynamically or rely on the one from firebase/firestore
    // Actually we need to import onSnapshot at the top of the file!
    import('firebase/firestore').then(({ onSnapshot }) => {
      let unsubscribeSub: (() => void) | undefined;
      
      const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          
          const db = getLocalDb();
          const subRef = doc(db, "users", currentUser.uid, "subscription", "current");
          
          unsubscribeSub = onSnapshot(subRef, (subDoc) => {
            if (subDoc.exists()) {
              const data = subDoc.data();
              const isActive = data?.status === 'active';
              const expiration = data?.expires_at;
              const notExpired = expiration ? new Date(expiration) > new Date() : false;
              setIsPremium(isActive && notExpired);
              setExpiresAt(expiration || null);
            } else {
              setIsPremium(false);
              setExpiresAt(null);
            }
            setLoadingPremium(false);
          }, (err) => {
            console.error("Subscription sync failed:", err);
            setLoadingPremium(false);
          });
        } else {
          setUser(null);
          setIsPremium(false);
          setLoadingPremium(false);
          setExpiresAt(null);
          if (unsubscribeSub) unsubscribeSub();
        }
        setLoading(false);
      });

      return () => {
        unsubscribeAuth();
        if (unsubscribeSub) unsubscribeSub();
      };
    });
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const db = getLocalDb();
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (!userDoc.exists()) {
        // User not in DB -> Force Sign Up First
        await firebaseSignOut(auth);
        throw new Error("No account found. Please sign up first.");
      }
      // User exists, they are signed in.
    } catch (error: any) {
      throw error;
    }
  };

  const signUpWithGoogle = async () => {
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const db = getLocalDb();
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user
        await setDoc(userDocRef, {
          email: result.user.email,
          name: result.user.displayName,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Ensure separation: point them to sign in
        await firebaseSignOut(auth);
        throw new Error("Account already exists. Please sign in instead.");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const db = getLocalDb();
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error("No account found. Please sign up first.");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    const auth = getFirebaseAuth();
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      
      await updateProfile(result.user, { displayName: name });
      
      const db = getLocalDb();
      const userDocRef = doc(db, "users", result.user.uid);
      await setDoc(userDocRef, {
        email: result.user.email,
        name: name,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      throw error;
    }
  };

  const logOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isPremium, loadingPremium, expiresAt,
      signInWithGoogle, signUpWithGoogle,
      signInWithEmail, signUpWithEmail,
      logOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
