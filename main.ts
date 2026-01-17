Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return json({ error: "Missing url parameter" }, 400);
  }

  let html: string;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        accept: "text/html",
      },
    });

    html = await res.text();
  } catch {
    return json({ error: "Failed to fetch URL" }, 500);
  }

  const parsed = parseHtml(html);

  return json({
    url: targetUrl,
    title: parsed.title,
    metas: parsed.metas,
    links: parsed.links,
  });
});

/* -------------------- Helpers -------------------- */

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseHtml(html: string) {
  const metas: Record<string, string[]> = {};
  const links: Record<string, string[]> = {};

  // <title>
  let title: string | null = null;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // <meta ...>
  const metaRegex =
    /<meta\s+[^>]*(?:name|property|itemprop)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;

  let match;
  while ((match = metaRegex.exec(html))) {
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!metas[key]) metas[key] = [];
    metas[key].push(value);
  }

  // <link ...>
  const linkRegex =
    /<link\s+[^>]*rel=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;

  while ((match = linkRegex.exec(html))) {
    const rel = match[1].toLowerCase();
    const href = match[2].trim();
    if (!links[rel]) links[rel] = [];
    links[rel].push(href);
  }

  return { title, metas, links };
}
