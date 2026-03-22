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

export async function GET() {
  // Run all 3 GNews calls in parallel
  const [indiaResult, globalResult, startupResult] = await Promise.all([
    fetchGNews("india business economy finance", 8),
    fetchGNews("global economy markets finance stocks", 5),
    fetchGNews("india startup funding venture capital", 5),
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

    fetched_at: new Date().toISOString(),
  });
}
