/**
 * Checks if a string is a well-formed complete HTTP/HTTPS URL.
 * Used to gracefully hide broken LLM hallucinated links instead of navigating to an error page.
 */
export function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
export function getSearchUrl(query: string | undefined | null): string {
  const q = query || "latest business news";
  return `https://news.google.com/search?q=${encodeURIComponent(q)}`;
}
