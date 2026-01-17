Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) return json({ error: "Missing url parameter" }, 400);

  try {
    const res = await fetch(targetUrl, {
      headers: {
        // 1. On se fait passer pour le bot de Facebook (très efficace pour Maps)
        "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "fr-FR,fr;q=0.9",
        // 2. On ajoute un cookie de consentement pour éviter la page de barrière Google
        "cookie": "CONSENT=YES+cb.20240117-07-p0.fr+FX+901;",
      },
      redirect: "follow",
    });

    const html = await res.text();
    const parsed = parseHtml(html);

    return json({
      url: targetUrl,
      ...parsed
    });
  } catch (err) {
    return json({ error: "Failed to fetch", details: err.message }, 500);
  }
});

function parseHtml(html: string) {
  const metas: Record<string, string>[] = [];
  
  // Titre
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extraction de TOUTES les balises meta de manière exhaustive
  // Cette regex est plus permissive sur les espaces et les retours à la ligne
  const metaRegex = /<meta\s+([^>]+)>/gi;
  const attrRegex = /([a-zA-Z0-9:_-]+)\s*=\s*["']([^"']*)["']/gi;

  let match;
  while ((match = metaRegex.exec(html))) {
    const attrs: Record<string, string> = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(match[1]))) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2];
    }
    if (Object.keys(attrs).length > 0) metas.push(attrs);
  }

  return { title, metas };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
