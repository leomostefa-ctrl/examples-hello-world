import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
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

  return new Response(
    JSON.stringify({
      ok: true,
      url: targetUrl,
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
});
