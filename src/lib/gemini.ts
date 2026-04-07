import Groq from "groq-sdk";

// Groq key: prefer GEMINI_API_KEY (legacy name) then chat key then generic GROQ
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GROQ_CHAT_API_KEY ||
  process.env.GROQ_API_KEY ||
  "";

const groq = apiKey ? new Groq({ apiKey }) : null;

export function getGeminiModel() {
  return {
    generateContent: async (prompt: string) => {
      if (!groq) {
        throw new Error(
          "Missing Groq API key. Set GEMINI_API_KEY, GROQ_CHAT_API_KEY, or GROQ_API_KEY."
        );
      }
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
