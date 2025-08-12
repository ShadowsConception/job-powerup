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
  // Prefer main/article/job containers
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
  // If FORCE_MOCK_AI is set, just return raw
  if (process.env.FORCE_MOCK_AI === "1") return raw;

  const sys = `You are Job PowerUp, expanding job postings into a comprehensive, detailed description.
- Keep it factual to the source; do not invent employer names if missing.
- Output in markdown with headings, bullets, and bold keywords.
- Sections (if possible): Role Summary, Responsibilities (expanded/verbose), Required Qualifications, Preferred Qualifications, Tech/Tools, Soft Skills, Impact, Keywords.
- Be as detailed as possible while staying relevant to the role.
- Avoid marketing fluff; focus on concrete requirements and responsibilities.`;

  const usr = `Original page title: ${pageTitle || "N/A"}
Extracted job text (may be messy):

"""${raw}"""

Rewrite into a clean, **long-form**, highly detailed job description for the same role, preserving all details but organizing them clearly.`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
    temperature: 0.5,
  });

  const out = completion.choices?.[0]?.message?.content?.trim() || raw;
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { url, detail } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const html = await fetchPage(url);
    const { text, title } = extractText(html);
    if (!text || text.length < 200) throw new Error("No readable content found at that link.");

    const finalText = detail === "max" ? await expandWithAI(text, title) : text;

    return NextResponse.json({ text: finalText, title: title || undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 });
  }
}
