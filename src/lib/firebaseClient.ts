"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import type { BriefingData, DailyBriefing } from "./briefingTypes";

function getFirebaseClientApp() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // This will surface in the browser console instead of failing silently.
    throw new Error(`Missing Firebase client env vars: ${missing.join(", ")}`);
  }

  const existing = getApps();
  if (existing.length > 0) return existing[0]!;
  return initializeApp(firebaseConfig);
}

function getDb() {
  return getFirestore(getFirebaseClientApp());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseClientApp());
}

export const googleProvider = new GoogleAuthProvider();

// Collection layout in Firestore:
// - `daily_briefings` documents keyed by `date` (YYYY-MM-DD)
// - each doc contains: { date: string, briefing: BriefingData, created_at: string }
const DAILY_BRIEFINGS_COLLECTION = "daily_briefings";

export async function getLatestDailyBriefing(): Promise<BriefingData | null> {
  const db = getDb();
  const q = query(
    collection(db, DAILY_BRIEFINGS_COLLECTION),
    orderBy("date", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0]!;
  const briefing = docSnap.data()?.briefing as BriefingData | undefined;
  return briefing ?? null;
}

export async function getDailyBriefingByDate(date: string): Promise<DailyBriefing | null> {
  const db = getDb();
  const docRef = doc(db, DAILY_BRIEFINGS_COLLECTION, date);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data() as {
    date?: string;
    briefing?: BriefingData;
    created_at?: string;
  };

  if (!data.briefing) return null;

  return {
    id: docSnap.id,
    date: data.date ?? docSnap.id,
    briefing: data.briefing,
    created_at: data.created_at ?? data.briefing.generated_at ?? new Date().toISOString(),
  };
}

export async function getDailyBriefingHistory(limitCount = 30): Promise<DailyBriefing[]> {
  const db = getDb();
  const q = query(
    collection(db, DAILY_BRIEFINGS_COLLECTION),
    orderBy("date", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
    const data = d.data() as {
      date?: string;
      briefing?: BriefingData;
      created_at?: string;
    };

    if (!data.briefing) return null;

    return {
      id: d.id,
      date: data.date ?? d.id,
      briefing: data.briefing,
      created_at: data.created_at ?? data.briefing.generated_at ?? new Date().toISOString(),
    } satisfies DailyBriefing;
    })
    .filter((v): v is DailyBriefing => v !== null);
}

export async function getAllDailyBriefingDates(): Promise<string[]> {
  const db = getDb();
  const q = query(
    collection(db, DAILY_BRIEFINGS_COLLECTION),
    orderBy("date", "desc"),
    // Fetch all; this app expects a relatively small history set.
    limit(3650)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => (d.data() as { date?: string }).date ?? d.id)
    .filter(Boolean);
}

