function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return undefined;
  const title = decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim());
  return title || undefined;
}

function htmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ");

  const articleMatch = withoutNoise.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyMatch = withoutNoise.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const source = articleMatch?.[1] || bodyMatch?.[1] || withoutNoise;

  const withLineBreaks = source
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li)>/gi, "\n");

  const noTags = withLineBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(noTags);

  return decoded
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function fetchUrl(sourceUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(sourceUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapeSourceContent(sourceUrl: string): Promise<{ sourceUrl: string; title?: string; content: string }> {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl.trim());
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }

  const normalizedUrl = parsed.toString();
  const raw = await fetchUrl(normalizedUrl);
  const title = extractTitle(raw);
  const content = htmlToText(raw);

  if (!content) {
    throw new Error("No readable content found at URL");
  }

  return {
    sourceUrl: normalizedUrl,
    title,
    content,
  };
}
