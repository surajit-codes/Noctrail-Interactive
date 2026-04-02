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
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signUpWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Since we want strict login/signup separation, we check if they exist here too,
        // though normally the strict check happens during signInWithGoogle.
        // We'll trust the current session if it exists, or one could do another DB check here.
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
      user, loading,
      signInWithGoogle, signUpWithGoogle,
      signInWithEmail, signUpWithEmail,
      logOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
