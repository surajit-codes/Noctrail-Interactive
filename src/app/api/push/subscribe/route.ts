import { NextRequest, NextResponse } from "next/server";
import { upsertPushSubscription } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys) {
      return NextResponse.json(
        { error: "Missing endpoint or keys" },
        { status: 400 }
      );
    }

    await upsertPushSubscription(endpoint, keys);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", details: String(err) },
      { status: 400 }
    );
  }
}
