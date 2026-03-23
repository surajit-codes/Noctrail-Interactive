import admin from "firebase-admin";
import type { BriefingData } from "./briefingTypes";

type PushSubscriptionKeys = { p256dh: string; auth: string };

let adminDb: FirebaseFirestore.Firestore | null = null;

function getAdminDb(): FirebaseFirestore.Firestore {
  if (adminDb) return adminDb;

  if (!admin.apps.length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
    const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (rawServiceAccount) {
      const serviceAccount = JSON.parse(rawServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (googleAppCreds) {
      // Requires GOOGLE_APPLICATION_CREDENTIALS pointing to a JSON key file.
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      throw new Error(
        "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY_JSON (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (path)."
      );
    }
  }

  adminDb = admin.firestore();
  return adminDb;
}

const DAILY_BRIEFINGS_COLLECTION = "daily_briefings";
const PUSH_SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

export async function upsertDailyBriefing(date: string, briefing: BriefingData) {
  const db = getAdminDb();
  const createdAt = new Date().toISOString();

  // Use `date` as document id for fast reads (and upsert semantics).
  await db
    .collection(DAILY_BRIEFINGS_COLLECTION)
    .doc(date)
    .set(
      {
        date,
        briefing,
        created_at: createdAt,
      },
      { merge: true }
    );
}

export async function upsertPushSubscription(
  endpoint: string,
  keys: PushSubscriptionKeys
) {
  const db = getAdminDb();

  await db
    .collection(PUSH_SUBSCRIPTIONS_COLLECTION)
    .doc(endpoint)
    .set(
      {
        endpoint,
        keys,
      },
      { merge: true }
    );
}

export async function listPushSubscriptions(): Promise<
  Array<{ endpoint: string; keys: PushSubscriptionKeys }>
> {
  const db = getAdminDb();
  const snapshot = await db.collection(PUSH_SUBSCRIPTIONS_COLLECTION).get();

  return snapshot.docs
    .map((d) => d.data() as { endpoint?: string; keys?: PushSubscriptionKeys })
    .filter((v): v is { endpoint: string; keys: PushSubscriptionKeys } => {
      return Boolean(v.endpoint && v.keys && v.keys.p256dh && v.keys.auth);
    });
}

export async function deletePushSubscription(endpoint: string) {
  const db = getAdminDb();
  await db.collection(PUSH_SUBSCRIPTIONS_COLLECTION).doc(endpoint).delete();
}

