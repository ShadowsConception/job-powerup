import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function fetchText(url: string) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 JobPowerUp" } });
  const html = await r.text();
  // light-weight extraction to avoid bringing cheerio
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  return { text: cleaned, title };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const { text, title } = await fetchText(url);

    // Summarize to a high-signal JD: keep responsibilities, must-haves, nice-to-haves, location, level, tech, comp if present.
    const prompt = [
      "You will receive raw scraped text from a job posting page. It may include navigation noise.",
      "Extract ONLY job-relevant content and produce a detailed, de-duplicated job description.",
      "Prefer specificity over brevity (700–1200 words if present). Keep headings and lists.",
      "Sections to include when available: Role Summary, Responsibilities, Required Qualifications, Preferred Qualifications, Tech/Tools, Location & Work Style, Compensation/Benefits, Application Notes.",
      "Remove company boilerplate, cookie notices, and repeated lines.",
      "Use **bold** and *italic* markdown where helpful.",
      "",
      `RAW:\n${text.slice(0, 120_000)}`, // safety cap
    ].join("\n");

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1400,
    });

    const jd = resp.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ text: jd, title });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 });
  }
}
