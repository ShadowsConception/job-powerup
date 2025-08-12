// app/api/summarize-job/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function summarize(raw: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const sys = `You clean job postings. Return plain text only.
Keep: role summary, key responsibilities, must-have & preferred qualifications, tech stack, location/remote, work auth/visa notes, comp if present.
Remove: navigation, ads, footers, unrelated links, cookie notices, application boilerplate.`;

  const user = `Raw job page text:\n\n"""${raw.slice(0, 50000)}"""`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });

  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`OpenAI ${r.status}: ${err || r.statusText}`);
  }
  const data = await r.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json({ error: "Provide raw job text to summarize." }, { status: 400 });
    }
    const summary = await summarize(text);
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Summarization failed" }, { status: 500 });
  }
}
