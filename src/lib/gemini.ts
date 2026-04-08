import { HfInference } from "@huggingface/inference";

const apiKey =
  process.env.HUGGINGFACE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GROQ_CHAT_API_KEY ||
  process.env.GROQ_API_KEY ||
  "";

const hf = apiKey ? new HfInference(apiKey) : null;

export function getGeminiModel() {
  return {
    generateContent: async (prompt: string) => {
      if (!hf) {
        throw new Error(
          "Missing Hugging Face API key. Set HUGGINGFACE_API_KEY in .env.local."
        );
      }
      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const completion = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-7B-Instruct",
            messages: [
              {
                role: "system",
                content:
                  "You are a senior business analyst and investment strategist specializing in Indian markets. " +
                  "Analyze market data and news and return a comprehensive briefing as a JSON object. " +
                  "Output ONLY valid JSON matching the exact schema."
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }, {
            wait_for_model: true,
          } as any);

          const responseText = completion.choices[0]?.message?.content || "{}";

          return {
            response: {
              text: () => responseText,
            },
          };
        } catch (error: any) {
          lastError = error;
          console.error(`[Inference] Attempt ${attempt} failed:`, error.message || error);
          if (attempt < maxRetries) {
            const delay = attempt * 3000;
            console.log(`[Inference] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      console.error("[Inference] All attempts failed.");
      throw lastError;
    },
  };
}
