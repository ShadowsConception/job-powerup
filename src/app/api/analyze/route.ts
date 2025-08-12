import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const form = await req.formData();
  const jobDescription = String(form.get("jobDescription") || "");
  const file = form.get("file") as File | null;

  // (Assumes you already extract resume text elsewhere — keep your existing logic)
  // You can optionally read file here and extract text if needed.

  const sys = [
    "You are Job PowerUp. Produce resume-tailoring advice.",
    "IMPORTANT:",
    "- Always spell it exactly as 'resume' (no accents).",
    "- Output clean Markdown (headings, numbered/bulleted lists).",
    "- No quote blocks, no code fences.",
    "- Be concise but complete; formatting must be ready to render."
  ].join("\n");

  const user = [
    "Create 'How to Improve Your Resume' guidance for THIS job.",
    "Use short section headings in **bold** and numbered bullets with specific examples.",
    "",
    "JOB DESCRIPTION:",
    jobDescription
  ].join("\n");

  const rsp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ]
  });

  const improvements = rsp.choices[0]?.message?.content || "";
  return NextResponse.json({ improvements });
}
