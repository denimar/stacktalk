import { NextRequest, NextResponse } from "next/server";

const PROXY_BASE = "/api/preview-proxy";

function getToken(): string | null {
  return process.env.GITHUB_PERSONAL_ACCESS_TOKEN || null;
}

function resolveUrl(rawUrl: string, base: string): string {
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const origin = new URL(base).origin;
  if (rawUrl.startsWith("/")) {
    return `${origin}${rawUrl}`;
  }
  const baseDir = base.replace(/\/[^/]*$/, "/");
  return `${baseDir}${rawUrl}`;
}

function rewriteHtml(html: string, baseUrl: string): string {
  const origin = new URL(baseUrl).origin;
  const proxyPrefix = `${PROXY_BASE}?url=`;
  let result = html;
  result = result.replace(
    /(src|href|action)=(["'])((?:\/|https?:\/\/)[^"']*?)\2/gi,
    (_match, attr, quote, url) => {
      if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("#")) {
        return `${attr}=${quote}${url}${quote}`;
      }
      const absoluteUrl = url.startsWith("http") ? url : `${origin}${url}`;
      if (!absoluteUrl.includes(".app.github.dev")) {
        return `${attr}=${quote}${url}${quote}`;
      }
      return `${attr}=${quote}${proxyPrefix}${encodeURIComponent(absoluteUrl)}${quote}`;
    }
  );
  result = result.replace(
    /url\((["']?)(\/[^)"']+)\1\)/gi,
    (_match, quote, url) => {
      const absoluteUrl = `${origin}${url}`;
      return `url(${quote}${proxyPrefix}${encodeURIComponent(absoluteUrl)}${quote})`;
    }
  );
  const scriptTag = `<script>
(function() {
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && (input.startsWith('/') || input.includes('.app.github.dev'))) {
      var abs = input.startsWith('http') ? input : '${origin}' + input;
      if (abs.includes('.app.github.dev')) {
        input = '${proxyPrefix}' + encodeURIComponent(abs);
      }
    }
    return origFetch.call(this, input, init);
  };
  var origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && (url.startsWith('/') || url.includes('.app.github.dev'))) {
      var abs = url.startsWith('http') ? url : '${origin}' + url;
      if (abs.includes('.app.github.dev')) {
        url = '${proxyPrefix}' + encodeURIComponent(abs);
      }
    }
    return origXHROpen.apply(this, [method, url, ...Array.prototype.slice.call(arguments, 2)]);
  };
})();
</script>`;
  result = result.replace(/<head([^>]*)>/i, `<head$1>${scriptTag}`);
  return result;
}

async function proxyFetch(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Cookie: `GHCS_ACCESS_TOKEN=${token}`,
      Authorization: `Bearer ${token}`,
      "User-Agent": "StackTalk-Preview-Proxy",
    },
    redirect: "follow",
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }
  const resolved = resolveUrl(url, url);
  if (!resolved.includes(".app.github.dev")) {
    return NextResponse.json({ error: "Only github.dev URLs are allowed" }, { status: 403 });
  }
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "No GitHub token configured" }, { status: 500 });
  }
  try {
    const response = await proxyFetch(resolved, token);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    if (contentType.includes("text/html")) {
      const html = await response.text();
      const rewritten = rewriteHtml(html, resolved);
      return new NextResponse(rewritten, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
        },
      });
    }
    const body = await response.arrayBuffer();
    const headers: Record<string, string> = { "Content-Type": contentType };
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      headers["Cache-Control"] = cacheControl;
    }
    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Proxy fetch failed: ${message}` }, { status: 502 });
  }
}
