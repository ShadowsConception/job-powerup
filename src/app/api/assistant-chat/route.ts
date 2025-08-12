import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const { messages = [], context = {} } = await req.json();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const sys = [
    "You are Job PowerUp — a helpful, frank assistant for resume tailoring and interview prep.",
    "Rules:",
    "- Always use 'resume' (no accents).",
    "- If you are not sure, say so briefly and ask for needed details.",
    "- Prefer concrete rewrites, bullet examples, and structured steps.",
    "- When the user pastes text with **bold**, preserve it (no quote blocks).",
    "- Keep answers short and skimmable."
  ].join("\n");

  const ctx = [
    "Context you may use if relevant:",
    `Job description (may be long): ${context.jobDescription || "(none)"}`,
    `Resume filename: ${context.resumeFilename || "(none)"}`,
    `Resume text (if available): ${context.resumeText?.slice(0, 3000) || "(none)"}`,
    `Existing improvements (if any): ${(context.improvements || "").slice(0, 2000)}`,
    `Existing cover letter (if any): ${(context.coverLetter || "").slice(0, 2000)}`
  ].join("\n");

  const rsp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      { role: "system", content: sys },
      { role: "system", content: ctx },
      ...messages
    ]
  });

  return NextResponse.json({ reply: rsp.choices[0]?.message?.content || "" });
}
