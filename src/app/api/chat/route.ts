import { HfInference } from "@huggingface/inference";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, marketData, userId } = body;

    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.GROQ_CHAT_API_KEY || process.env.GROQ_API_KEY;

    // ─── Rate Limiting for Free Users ───
    if (userId) {
      try {
        const adminDb = getAdminDb();
        const today = new Date().toISOString().split("T")[0];

        // Check subscription status
        const subDoc = await adminDb
          .collection("users")
          .doc(userId)
          .collection("subscription")
          .doc("current")
          .get();

        let userIsPremium = false;
        if (subDoc.exists) {
          const subData = subDoc.data();
          userIsPremium =
            subData?.status === "active" &&
            new Date(subData?.expires_at) > new Date();
        }

        if (!userIsPremium) {
          const usageRef = adminDb
            .collection("users")
            .doc(userId)
            .collection("usage")
            .doc("chat");

          const usageDoc = await usageRef.get();
          const usage = usageDoc.exists ? usageDoc.data() : null;

          if (usage?.date === today && usage?.count >= 3) {
            return Response.json(
              {
                error: "daily_limit_reached",
                message:
                  "You have used all 3 free messages today. Upgrade to Premium for unlimited AI chat! 👑",
              },
              { status: 429 }
            );
          }

          // Increment count
          await usageRef.set({
            date: today,
            count: (usage?.date === today ? (usage.count || 0) : 0) + 1,
          });
        }
      } catch (rateLimitErr) {
        // If rate limiting check fails, allow the request through
        console.warn("Rate limit check failed, allowing request:", rateLimitErr);
      }
    }

    // Build system context
    let systemContent =
      "You are BriefAI, an advanced AI assistant for the CEO of an Indian business. You are professional, highly analytical, and extremely concise. Format your answers with markdown (bold, bullets). Keep responses focused and actionable.";

    if (marketData) {
      try {
        const essentialMarketData = {
          nifty: marketData.nifty?.current_price ? { current_price: marketData.nifty.current_price } : undefined,
          sensex: marketData.sensex?.current_price ? { current_price: marketData.sensex.current_price } : undefined,
          spot: marketData.spot || {},
          last_updated: marketData.last_updated
        };
        const marketJson = JSON.stringify(essentialMarketData, null, 2);
        systemContent += `\n\nLIVE MARKET DATA (Context):\n${marketJson}`;
      } catch (e) {
        console.warn("Failed to stringify marketData for AI context", e);
      }
    }

    const MAX_HISTORY = 10;
    const allMessages = (messages as Array<{ role: string; content: string }> || [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim());
    
    const cleanMessages = allMessages
      .slice(-MAX_HISTORY)
      .reduce<Array<{ role: string; content: string }>>((acc, m) => {
        if (acc.length === 0 && m.role === "assistant") return acc;
        return [...acc, m];
      }, []);

    if (cleanMessages.length === 0) {
      return Response.json({ error: "No valid user messages provided" }, { status: 400 });
    }

    if (!apiKey) {
      const demoText = "I'm in demo mode since no HUGGINGFACE API key was set. Add HUGGINGFACE_API_KEY to your .env.local to enable full AI responses.";
      return new Response(`0:${JSON.stringify(demoText)}\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "x-vercel-ai-data-stream": "v1" }
      });
    }

    const hf = new HfInference(apiKey);
    
    const hfRes = await hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "system", content: systemContent }, ...(cleanMessages as any)],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text: string = hfRes.choices?.[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

    return new Response(`0:${JSON.stringify(text)}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-vercel-ai-data-stream": "v1",
        "Cache-Control": "no-cache"
      },
    });
  } catch (error: any) {
    console.error("Critical Chat API error:", error?.message || error);
    return Response.json({ error: "Internal server error occurred", details: error?.message }, { status: 500 });
  }
}
