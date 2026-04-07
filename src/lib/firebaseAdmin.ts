import admin from "firebase-admin";
import type { BriefingData } from "./briefingTypes";
import fs from "node:fs";
import path from "node:path";

type PushSubscriptionKeys = { p256dh: string; auth: string };

let adminDb: FirebaseFirestore.Firestore | null = null;

/**
 * Vercel-friendly: service account split across env vars (matches Firebase JSON fields).
 * PRIVATE_KEY often contains literal \n — normalize to real newlines.
 */
function getServiceAccountFromSplitEnv(): Record<string, string> | null {
  const projectId = process.env.PROJECT_ID;
  const clientEmail = process.env.CLIENT_EMAIL;
  const privateKeyRaw = process.env.PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const account: Record<string, string> = {
    type: process.env.TYPE || "service_account",
    project_id: projectId,
    private_key: privateKey,
    client_email: clientEmail,
  };

  if (process.env.PRIVATE_KEY_ID) account.private_key_id = process.env.PRIVATE_KEY_ID;
  if (process.env.CLIENT_ID) account.client_id = process.env.CLIENT_ID;
  if (process.env.AUTH_URI) account.auth_uri = process.env.AUTH_URI;
  if (process.env.TOKEN_URI) account.token_uri = process.env.TOKEN_URI;
  if (process.env.AUTH_PROVIDER_X509_CERT_URL)
    account.auth_provider_x509_cert_url = process.env.AUTH_PROVIDER_X509_CERT_URL;
  if (process.env.CLIENT_X509_CERT_URL)
    account.client_x509_cert_url = process.env.CLIENT_X509_CERT_URL;

  return account;
}

function resolveServiceAccountPath(explicitPath?: string): string | null {
  if (explicitPath && fs.existsSync(explicitPath)) return explicitPath;

  const localPath = path.join(process.cwd(), "service-account.json");
  if (fs.existsSync(localPath)) return localPath;

  return null;
}

export function getAdminDb(): FirebaseFirestore.Firestore {
  if (adminDb) return adminDb;

  if (!admin.apps.length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
    const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (rawServiceAccount) {
      const serviceAccount = JSON.parse(rawServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      const splitAccount = getServiceAccountFromSplitEnv();
      if (splitAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(splitAccount as admin.ServiceAccount),
        });
      } else {
        const serviceAccountPath = resolveServiceAccountPath(googleAppCreds);
        if (!serviceAccountPath) {
          throw new Error(
            "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY_JSON, or PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY (and optional TYPE, …), or a valid GOOGLE_APPLICATION_CREDENTIALS file path."
          );
        }

        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, "utf8")
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
  }

  adminDb = admin.firestore();
  return adminDb;
}

const DAILY_BRIEFINGS_COLLECTION = "daily_briefings";
const PUSH_SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

export async function upsertDailyBriefing(userId: string, date: string, briefing: BriefingData) {
  const db = getAdminDb();
  const createdAt = new Date().toISOString();

  // Changed: Use auto-generated ID to preserve history of every run,
  // but keep the 'date' field for querying latest by day.
  await db
    .collection("users")
    .doc(userId)
    .collection(DAILY_BRIEFINGS_COLLECTION)
    .add({
      date,
      briefing,
      created_at: createdAt,
    });
}

export async function getAllUsers(): Promise<Array<{ id: string; email: string; name?: string }>> {
  const db = getAdminDb();
  const snapshot = await db.collection("users").get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      name: data.name,
    };
  }).filter(u => !!u.email);
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

