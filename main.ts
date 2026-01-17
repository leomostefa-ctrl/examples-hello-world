Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) return json({ error: "Missing url parameter" }, 400);

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "accept": "text/html",
        "cookie": "CONSENT=YES+cb.20240117-07-p0.fr+FX+901;",
      },
      redirect: "follow",
    });

    const html = await res.text();
    const result = parseHtml(html, targetUrl);

    return json(result);
  } catch (err) {
    return json({ error: "Failed to fetch", details: err.message }, 500);
  }
});

function parseHtml(html: string, url: string) {
  // On crée un objet de base avec l'URL et le titre
  const metadata: Record<string, any> = {
    url: url,
    title: ""
  };

  // 1. Extraction du titre HTML standard
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1].trim();

  // 2. Extraction de toutes les balises meta
  const metaRegex = /<meta\s+([^>]+)>/gi;
  const attrRegex = /([a-zA-Z0-9:_-]+)\s*=\s*["']([^"']*)["']/gi;

  let match;
  while ((match = metaRegex.exec(html))) {
    const attrs: Record<string, string> = {};
    let attrMatch;
    
    // On extrait tous les attributs de la balise
    while ((attrMatch = attrRegex.exec(match[1]))) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2];
    }

    // On détermine quelle est la clé (name, property, http-equiv ou itemprop)
    const key = attrs.name || attrs.property || attrs["http-equiv"] || attrs.itemprop;
    const content = attrs.content;

    if (key && content !== undefined) {
      // Si la clé existe déjà (ex: plusieurs og:image), on en fait un tableau
      if (metadata[key]) {
        if (Array.isArray(metadata[key])) {
          metadata[key].push(content);
        } else {
          metadata[key] = [metadata[key], content];
        }
      } else {
        metadata[key] = content;
      }
    } else if (attrs.charset) {
      metadata["charset"] = attrs.charset;
    }
  }

  return metadata;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
