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
    return json(parseHtml(html, targetUrl));
  } catch (err) {
    return json({ error: "Failed to fetch", details: err.message }, 500);
  }
});

function parseHtml(html: string, url: string) {
  const result: any = {
    url,
    title: "",
    metadata: {
      open_graph: {} as Record<string, string>,
      twitter: {} as Record<string, string>,
      standard: {} as Record<string, string>,
      others: [] as any[]
    }
  };

  // 1. Extraction du titre classique
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  result.title = titleMatch ? titleMatch[1].trim() : "";

  // 2. Extraction et tri des Metas
  const metaRegex = /<meta\s+([^>]+)>/gi;
  const attrRegex = /([a-zA-Z0-9:_-]+)\s*=\s*["']([^"']*)["']/gi;

  let match;
  while ((match = metaRegex.exec(html))) {
    const attrs: Record<string, string> = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(match[1]))) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2];
    }

    // Extraction de la clé (name, property ou http-equiv) et de la valeur (content)
    const key = attrs.name || attrs.property || attrs["http-equiv"];
    const content = attrs.content;

    if (key && content) {
      if (key.startsWith("og:")) {
        result.metadata.open_graph[key.replace("og:", "")] = content;
      } else if (key.startsWith("twitter:")) {
        result.metadata.twitter[key.replace("twitter:", "")] = content;
      } else if (["description", "keywords", "author", "viewport"].includes(key)) {
        result.metadata.standard[key] = content;
      } else {
        result.metadata.others.push({ [key]: content });
      }
    } else if (Object.keys(attrs).length > 0) {
      // Cas particuliers comme <meta charset="utf-8">
      result.metadata.others.push(attrs);
    }
  }

  return result;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
