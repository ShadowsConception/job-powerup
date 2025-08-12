export const runtime = "nodejs";

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function cleanText(t: string) {
  return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Fetch the HTML (server-side to avoid CORS)
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 JobPowerUpBot" } });
    if (!resp.ok) {
      return NextResponse.json({ error: `Fetch failed: ${resp.status}` }, { status: 400 });
    }
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Try to pull the most useful text blocks
    // Heuristics for common job pages (title, sections, list items)
    const parts: string[] = [];

    const title = $("h1").first().text() || $("title").text();
    if (title) parts.push(`# ${title}`);

    // Prefer main/section/article
    const main =
      $("main").text() ||
      $("article").text() ||
      $("section").text() ||
      $("#jobDescriptionText").text() || // Indeed
      $(".jobs-description__container").text(); // LinkedIn (may be blocked)

    if (main && cleanText(main).length > 200) {
      parts.push(cleanText(main));
    } else {
      // Fallback to list items & paragraphs
      const li = $("li").slice(0, 200).map((_, el) => $(el).text()).get().join("\n");
      const p = $("p").slice(0, 50).map((_, el) => $(el).text()).get().join("\n");
      const combined = cleanText(`${li}\n\n${p}`);
      parts.push(combined);
    }

    let text = cleanText(parts.join("\n\n"));
    // Trim huge pages
    if (text.length > 12000) text = text.slice(0, 12000);

    if (!text || text.length < 120) {
      return NextResponse.json({
        error: "Could not extract job text (site may block bots).",
        suggestion: "Copy/paste the job description text into the box instead.",
      }, { status: 422 });
    }

    return NextResponse.json({ text, length: text.length });
  } catch (e) {
    console.error("JOBTEXT error:", e);
    return NextResponse.json({
      error: "Failed to read job page.",
      suggestion: "Copy/paste the job description text into the box.",
    }, { status: 500 });
  }
}
