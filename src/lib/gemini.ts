import Groq from "groq-sdk";

// Using the key provided in GEMINI_API_KEY in .env.local
const apiKey = process.env.GEMINI_API_KEY!;

const groq = new Groq({ apiKey });

export function getGeminiModel() {
  return {
    generateContent: async (prompt: string) => {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a senior business analyst and investment strategist specializing in Indian markets. " +
              "You have 20 years of experience. Analyze the provided market data and news and return a comprehensive " +
              "business intelligence briefing as a JSON object. Be specific, data-driven, and actionable. Never be vague.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.4,
        top_p: 0.9,
      });

      return {
        response: {
          text: () => completion.choices[0]?.message?.content || "{}",
        },
      };
    },
  };
}
