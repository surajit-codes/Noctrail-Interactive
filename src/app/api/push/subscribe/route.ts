import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert({ endpoint, keys }, { onConflict: "endpoint" });

    if (error) {
      console.error("Supabase push subscription error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", details: String(err) },
      { status: 400 }
    );
  }
}
