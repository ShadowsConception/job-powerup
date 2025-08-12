import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchPage(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "JobPowerUpBot/1.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
  const html = await res.text();
  return html;
}

function extractText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const target =
    $("main:contains(job), main")?.first().text() ||
    $("article:contains(job), article")?.first().text() ||
    $("[role=main]")?.first().text() ||
    $(".job, .job-description, .description, .posting, .content").first().text() ||
    $("body").text();

  const clean = target.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $('meta[name="title"]').attr("content") ||
    "";

  return { text: clean, title };
}

async function expandWithAI(raw: string, pageTitle: string | undefined) {
  if (process.env.FORCE_MOCK_AI === "1") return raw;

  const sys = `You are Job PowerUp. Rewrite messy job postings into a clean, concise, *job-relevant* description.
- Keep all requirements/responsibilities, skills, years of experience, education, location, compensation, and tech stack.
- Remove irrelevant fluff: company marketing blurbs, DEI statements, application instructions, cookie banners, unrelated disclaimers.
- De-duplicate and merge similar bullets. Normalize formatting.
- Output in markdown with headings and bullets. Use **bold** for key skills/requirements.`;

  const usr = `Original page title: ${pageTitle || "N/A"}
Raw extracted text (may include noise):

"""${raw}"""

Summarize into a *concise but complete* job description that preserves job-relevant details only. Avoid repetition.`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
    temperature: 0.3,
  });

  const out = completion.choices?.[0]?.message?.content?.trim() || raw;
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const html = await fetchPage(url);
    const { text, title } = extractText(html);
    if (!text || text.length < 200) throw new Error("No readable content found at that link.");

    // Summarize + clean
    const finalText = await expandWithAI(text, title);

    return NextResponse.json({ text: finalText, title: title || undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 });
  }
}
