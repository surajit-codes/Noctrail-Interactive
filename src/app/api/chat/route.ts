import { HfInference } from "@huggingface/inference";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, marketData } = body;

    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.GROQ_CHAT_API_KEY || process.env.GROQ_API_KEY;

    // Build system context
    let systemContent =
      "You are BriefAI, an advanced AI assistant for the CEO of an Indian business. You are professional, highly analytical, and extremely concise. Format your answers with markdown (bold, bullets). Keep responses focused and actionable.";

    if (marketData) {
      try {
        // Truncate marketData to essential fields to save tokens
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

    // Build clean message array — only user/assistant, starting from first user message
    // Truncate history to avoid token limit errors (llama-3.1-8b-instant has a 6k limit in some tiers)
    const MAX_HISTORY = 10;
    const allMessages = (messages as Array<{ role: string; content: string }> || [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim());
    
    const cleanMessages = allMessages
      .slice(-MAX_HISTORY) // Only take the last 10 messages
      .reduce<Array<{ role: string; content: string }>>((acc, m) => {
        // skip leading assistant messages if any
        if (acc.length === 0 && m.role === "assistant") return acc;
        return [...acc, m];
      }, []);

    if (cleanMessages.length === 0) {
      return Response.json({ error: "No valid user messages provided" }, { status: 400 });
    }

    if (!apiKey) {
      // Demo mode — no API key
      const demoText = "I'm in demo mode since no HUGGINGFACE API key was set. Add HUGGINGFACE_API_KEY to your .env.local to enable full AI responses.";
      return new Response(`0:${JSON.stringify(demoText)}\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "x-vercel-ai-data-stream": "v1" }
      });
    }

    const hf = new HfInference(apiKey);
    
    // Call Hugging Face API directly
    const hfRes = await hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct", // Fast chat model
      messages: [{ role: "system", content: systemContent }, ...(cleanMessages as any)],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text: string = hfRes.choices?.[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

    // Return in Vercel AI SDK data stream format so client parser works
    // The format is "0:" followed by JSON stringified text
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
