// app/api/job-from-link/route.ts
import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- utils ----------
function clip(text: string, max = 50_000) {
  return text.length > max ? text.slice(0, max) : text;
}

function looksLikeBotWall(s: string) {
  const hay = s.toLowerCase();
  return (
    hay.includes("just a moment") ||
    hay.includes("cloudflare") ||
    hay.includes("additional verification required") ||
    hay.includes("ray id") ||
    hay.includes("captcha")
  );
}

function validateUrl(input: string) {
  try {
    const u = new URL(input);
    if (!/^https?:$/.test(u.protocol)) return { ok: false, msg: "URL must start with http or https." };
    return { ok: true, url: u };
  } catch {
    return { ok: false, msg: "That doesn’t look like a valid URL." };
  }
}

const BASE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-CH-UA": `"Chromium";v="124", "Not.A/Brand";v="24", "Google Chrome";v="124"`,
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": `"Windows"`,
};

async function fetchDirect(url: string, withGoogleReferrer = false) {
  const headers = withGoogleReferrer ? { ...BASE_HEADERS, Referer: "https://www.google.com/" } : BASE_HEADERS;
  return fetch(url, { headers, redirect: "follow", cache: "no-store" });
}

async function fetchViaReaderProxy(targetUrl: string) {
  const origin = targetUrl.replace(/^https?:\/\//, "");
  const proxyUrl = `https://r.jina.ai/http://${origin}`;
  return fetch(proxyUrl, { cache: "no-store", redirect: "follow" });
}

function parseJinaMarkdown(md: string) {
  let title = "";
  const mTitle = md.match(/^Title:\s*(.+)$/m);
  if (mTitle) title = mTitle[1].trim();

  const idx = md.indexOf("Markdown Content:");
  let body = idx >= 0 ? md.slice(idx + "Markdown Content:".length) : md;

  body = body
    .replace(/^URL Source:.*$/gmi, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[*-]\s+/gm, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { title, text: body };
}

function rewriteIndeedToMobile(u: URL): string | null {
  const host = u.hostname.toLowerCase();
  if (!host.endsWith("indeed.com")) return null;
  const jk = u.searchParams.get("jk") || u.searchParams.get("vjk");
  if (!jk) return null;
  return `https://www.indeed.com/m/basecamp/viewjob?jk=${encodeURIComponent(jk)}`;
}

// ---------- AI summarizer ----------
async function summarizeServerSide(req: Request, text: string) {
  try {
    const url = new URL("/api/summarize-job", req.url);
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) throw new Error("summarizer failed");
    const data = await r.json();
    return String(data?.summary || "").trim();
  } catch {
    return text;
  }
}

// ---------- handler ----------
export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid URL." }, { status: 400 });
    }

    const v = validateUrl(url.trim());
    if (!v.ok) return NextResponse.json({ error: v.msg }, { status: 422 });
    const u = v.url!;

    let tryUrls: string[] = [];
    const indeedMobile = rewriteIndeedToMobile(u);
    if (indeedMobile) tryUrls.push(indeedMobile);
    tryUrls.push(u.toString());

    for (const candidate of tryUrls) {
      // direct
      let res = await fetchDirect(candidate);
      if (res.status === 403 || res.status === 406) {
        res = await fetchDirect(candidate, true);
      }

      if (res.ok) {
        const html = await res.text();
        if (!html || looksLikeBotWall(html)) {
          // fall through
        } else {
          const dom = new JSDOM(html, { url: candidate });
          const doc = dom.window.document;
          doc.querySelectorAll("script,noscript,style").forEach((n) => n.remove());
          const reader = new Readability(doc);
          const article = reader.parse();

          const title = (article?.title || doc.title || "").trim();
          const text =
            (article?.textContent || "").replace(/\u00a0/g, " ").replace(/\s{2,}/g, " ").trim() ||
            (doc.body?.textContent || "").replace(/\s{2,}/g, " ").trim();

          if (text && text.length >= 200 && !looksLikeBotWall(text)) {
            const cleaned = await summarizeServerSide(req, text);
            return NextResponse.json({
              title,
              text: clip(cleaned),
              via: indeedMobile && candidate === indeedMobile ? "indeed-mobile+ai" : "direct+ai",
            });
          }
        }
      }

      // proxy
      const proxyRes = await fetchViaReaderProxy(candidate);
      if (proxyRes.ok) {
        const md = await proxyRes.text();
        if (!looksLikeBotWall(md)) {
          const parsed = parseJinaMarkdown(md);
          if (parsed.text && parsed.text.length >= 200) {
            const cleaned = await summarizeServerSide(req, parsed.text);
            return NextResponse.json({
              title: parsed.title,
              text: clip(cleaned),
              via: "proxy+ai",
            });
          }
        }
      }
    }

    return NextResponse.json(
      { error: "That site is blocking automated access. Use the in-browser bookmarklet (see /import-helper)." },
      { status: 451 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error while importing job posting." },
      { status: 500 }
    );
  }
}
