const textHeaders = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200, headers: textHeaders });
    }

    if (!env.ASSETS) {
      return new Response("Assets binding is not configured.", {
        status: 500,
        headers: textHeaders,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
