"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDocFromServer,
  getDocsFromServer,
  where,
  writeBatch,
  deleteDoc,
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

export async function getLatestDailyBriefing(userId: string): Promise<BriefingData | null> {
  const db = getDb();
  const q = query(
    collection(db, "users", userId, DAILY_BRIEFINGS_COLLECTION),
    orderBy("created_at", "desc"),
    limit(1)
  );

  // Always fetch fresh data from server, bypassing Firestore local cache
  const snap = await getDocsFromServer(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0]!;
  const briefing = docSnap.data()?.briefing as BriefingData | undefined;
  return briefing ?? null;
}

export async function getDailyBriefingByDate(userId: string, dateOrId: string): Promise<DailyBriefing | null> {
  const db = getDb();
  
  // 1. Try to query by the 'date' field
  const q = query(
    collection(db, "users", userId, DAILY_BRIEFINGS_COLLECTION),
    where("date", "==", dateOrId)
  );
  
  const snap = await getDocsFromServer(q);
  
  let targetDoc: any = null;
  
  if (!snap.empty) {
    // If multiple briefings exist for the same date, take the latest
    targetDoc = snap.docs.sort((a, b) => {
      const aTime = new Date((a.data().created_at || a.data().briefing?.generated_at) ?? 0).getTime();
      const bTime = new Date((b.data().created_at || b.data().briefing?.generated_at) ?? 0).getTime();
      return bTime - aTime;
    })[0];
  } else {
    // 2. Fallback: try fetching by document ID
    const docRef = doc(db, "users", userId, DAILY_BRIEFINGS_COLLECTION, dateOrId);
    const idSnap = await getDocFromServer(docRef);
    if (idSnap.exists()) {
      targetDoc = idSnap;
    }
  }

  if (!targetDoc) return null;

  const data = targetDoc.data() as {
    date?: string;
    briefing?: BriefingData;
    created_at?: string;
  };

  if (!data.briefing) return null;

  return {
    id: targetDoc.id,
    date: data.date ?? targetDoc.id,
    briefing: data.briefing,
    created_at: data.created_at ?? data.briefing.generated_at ?? new Date().toISOString(),
  };
}

export async function getDailyBriefingHistory(userId: string, limitCount = 30): Promise<DailyBriefing[]> {
  const db = getDb();
  const q = query(
    collection(db, "users", userId, DAILY_BRIEFINGS_COLLECTION),
    orderBy("created_at", "desc"),
    limit(limitCount)
  );

  // Bypass cache so history reflects newly generated briefings immediately.
  const snap = await getDocsFromServer(q);
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

export async function getAllDailyBriefingDates(userId: string): Promise<string[]> {
  const db = getDb();
  const q = query(
    collection(db, "users", userId, DAILY_BRIEFINGS_COLLECTION),
    orderBy("date", "desc"),
    // Fetch all; this app expects a relatively small history set.
    limit(3650)
  );

  // Keep dates list in sync with latest server data.
  const snap = await getDocsFromServer(q);
  const dates = snap.docs
    .map((d) => (d.data() as { date?: string }).date ?? d.id)
    .filter(Boolean);
  return Array.from(new Set(dates));
}

export async function wipeUserHistory(userId: string): Promise<void> {
  const db = getDb();
  const q = query(collection(db, "users", userId, DAILY_BRIEFINGS_COLLECTION));
  const snap = await getDocs(q);
  
  if (snap.empty) return;
  
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.delete(d.ref);
  });
  
  await batch.commit();
}

export async function restoreUserHistory(userId: string, history: DailyBriefing[]): Promise<void> {
  const db = getDb();
  if (!history || !Array.isArray(history) || history.length === 0) return;
  
  const chunks = [];
  for (let i = 0; i < history.length; i += 500) {
    chunks.push(history.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const item of chunk) {
      if (!item.date || !item.briefing) continue;
      const docRef = item.id 
        ? doc(db, "users", userId, DAILY_BRIEFINGS_COLLECTION, item.id) 
        : doc(collection(db, "users", userId, DAILY_BRIEFINGS_COLLECTION));
        
      batch.set(docRef, {
        date: item.date,
        briefing: item.briefing,
        created_at: item.created_at || new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
  }
}

export interface PortfolioItem {
  id: string; // Ticker symbol e.g., 'RELIANCE'
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

export async function getUserPortfolio(uid: string): Promise<PortfolioItem[]> {
  const db = getDb();
  const docRef = doc(db, "users", uid, "data", "portfolio");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];
  const data = snap.data();
  return (data.items || []) as PortfolioItem[];
}

export async function updateUserPortfolio(uid: string, items: PortfolioItem[]): Promise<void> {
  const db = getDb();
  const docRef = doc(db, "users", uid, "data", "portfolio");
  await setDoc(docRef, { items, updated_at: new Date().toISOString() }, { merge: true });
}

// ─── Chat History ──────────────────────────────────────────────────

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLimitMessage?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

export async function getChatThreads(userId: string): Promise<ChatThread[]> {
  const db = getDb();
  const q = query(
    collection(db, "users", userId, "chat_threads"),
    orderBy("updatedAt", "desc"),
    limit(50)
  );

  const snap = await getDocsFromServer(q);
  return snap.docs.map(doc => doc.data() as ChatThread);
}

export async function saveChatThread(userId: string, thread: ChatThread): Promise<void> {
  const db = getDb();
  const docRef = doc(db, "users", userId, "chat_threads", thread.id);
  await setDoc(docRef, thread, { merge: true });
}

export async function deleteChatThread(userId: string, threadId: string): Promise<void> {
  const db = getDb();
  const docRef = doc(db, "users", userId, "chat_threads", threadId);
  await deleteDoc(docRef);
}

