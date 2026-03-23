import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { deletePushSubscription, listPushSubscriptions } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    const body = await request.json();
    const { title, body: notifBody } = body;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPID keys not configured" },
        { status: 503 }
      );
    }

    // Configure VAPID per-request so invalid placeholders don't crash builds/module evaluation.
    try {
      webpush.setVapidDetails(
        "mailto:admin@briefai.app",
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );
    } catch (err) {
      console.error("Invalid VAPID keys:", err);
      return NextResponse.json(
        { error: "Invalid VAPID keys" },
        { status: 503 }
      );
    }

    // Fetch all subscriptions
    const subscriptions = await listPushSubscriptions();

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No subscribers" });
    }

    const payload = JSON.stringify({
      title: title ?? "🌅 Your Morning Briefing is Ready",
      body: notifBody ?? "Your AI-powered CEO briefing has been generated.",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: "/dashboard" },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as { p256dh: string; auth: string },
            },
            payload
          );
        } catch (err: unknown) {
          // If subscription is gone (410), remove it from DB
          if (typeof err === "object" && err !== null && "statusCode" in err) {
            const webPushErr = err as { statusCode: number };
            if (webPushErr.statusCode === 410) {
              await deletePushSubscription(sub.endpoint);
            }
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return NextResponse.json({ success: true, sent, failed });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json(
      { error: "Failed to send notifications", details: String(err) },
      { status: 500 }
    );
  }
}
