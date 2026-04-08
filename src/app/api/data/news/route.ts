import { NextResponse } from "next/server";

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE = "https://gnews.io/api/v4/search";

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

async function fetchGNews(
  query: string,
  max: number = 6
): Promise<{ articles: GNewsArticle[]; error?: string }> {
  if (!GNEWS_API_KEY) {
    return { articles: [], error: "GNEWS_API_KEY not configured" };
  }

  try {
    const url = new URL(GNEWS_BASE);
    url.searchParams.set("q", query);
    url.searchParams.set("lang", "en");
    url.searchParams.set("country", "in");
    url.searchParams.set("max", String(max));
    url.searchParams.set("apikey", GNEWS_API_KEY);
    url.searchParams.set("sortby", "publishedAt");

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // cache 30 min
    });

    if (!res.ok) {
      throw new Error(`GNews API error: ${res.status} ${res.statusText}`);
    }

    const data: GNewsResponse = await res.json();
    return { articles: data.articles ?? [] };
  } catch (err) {
    return { articles: [], error: String(err) };
  }
}

async function fetchAlphaVantageSentiment() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return { feed: [], error: "ALPHA_VANTAGE_API_KEY not configured" };

  try {
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "NEWS_SENTIMENT");
    url.searchParams.set("topics", "economy_macro,finance");
    url.searchParams.set("max_results", "5");
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) throw new Error(`AV API error: ${res.status}`);
    const data = await res.json();
    
    // Check for AV internal errors or limit messages
    if (data.Information || data.Note) {
      console.warn("Alpha Vantage limit/info:", data.Information || data.Note);
      return { feed: [], error: "Limit reached" };
    }

    return { 
      feed: (data.feed ?? []).map((item: any) => ({
        title: item.title,
        url: item.url,
        sentiment_score: item.overall_sentiment_score,
        sentiment_label: item.overall_sentiment_label,
        ticker_sentiment: item.ticker_sentiment ?? [],
      })),
      overall_sentiment_score: data.overall_sentiment_score,
      overall_sentiment_label: data.overall_sentiment_label,
    };
  } catch (err) {
    return { feed: [], error: String(err) };
  }
}

export async function GET() {
  // Run all GNews calls + Alpha Vantage Sentiment in parallel
  const [indiaResult, globalResult, startupResult, avSentiment] = await Promise.all([
    fetchGNews("india business economy finance", 8),
    fetchGNews("global economy markets finance stocks", 5),
    fetchGNews("india startup funding venture capital", 5),
    fetchAlphaVantageSentiment(),
  ]);

  const mapArticle = (a: GNewsArticle) => ({
    title: a.title,
    description: a.description,
    url: a.url,
    published_at: a.publishedAt,
    source: a.source.name,
  });

  return NextResponse.json({
    india_business: indiaResult.error
      ? { error: indiaResult.error, articles: [] }
      : { articles: indiaResult.articles.map(mapArticle) },

    global_markets: globalResult.error
      ? { error: globalResult.error, articles: [] }
      : { articles: globalResult.articles.map(mapArticle) },

    startup_vc: startupResult.error
      ? { error: startupResult.error, articles: [] }
      : { articles: startupResult.articles.map(mapArticle) },

    av_sentiment: avSentiment.error
      ? { error: avSentiment.error, feed: [] }
      : avSentiment,

    fetched_at: new Date().toISOString(),
  });
}
