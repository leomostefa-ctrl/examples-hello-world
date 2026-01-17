Deno.serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: "Missing url parameter" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }

  let html = "";

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
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Fetch failed" }),
      { status: 500 }
    );
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  return new Response(
    JSON.stringify({
      url: targetUrl,
      title,
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
});
