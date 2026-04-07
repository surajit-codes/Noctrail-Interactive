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
      const completion = await hf.chatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are a senior business analyst and investment strategist specializing in Indian markets. " +
              "You have 20 years of experience. Analyze the provided market data and news and return a comprehensive " +
              "business intelligence briefing as a JSON object. Be specific, data-driven, and actionable. Never be vague." +
              " Output ONLY valid JSON matching the exact schema."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        max_tokens: 2000,
        temperature: 0.4,
      });

      return {
        response: {
          text: () => completion.choices[0]?.message?.content || "{}",
        },
      };
    },
  };
}
