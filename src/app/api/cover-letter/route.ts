import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const form = await req.formData();
  const jobDescription = String(form.get("jobDescription") || "");
  const file = form.get("file") as File | null;

  const sys = [
    "You are Job PowerUp. Draft professional cover letters.",
    "Rules:",
    "- Always spell 'resume' without accents.",
    "- Produce plain Markdown paragraphs (no quote marks, no code fences).",
    "- Use a simple header block (applicant contact), greeting, 3–5 short paragraphs, closing.",
    "- No asterisks for bold inside the letter unless emphasizing a job keyword."
  ].join("\n");

  const user = [
    "Write a one-page cover letter tailored to the job below.",
    "Keep it specific and factual; avoid fluff.",
    "",
    "JOB DESCRIPTION:",
    jobDescription
  ].join("\n");

  const rsp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.45,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ]
  });

  const coverLetter = rsp.choices[0]?.message?.content || "";
  return NextResponse.json({ coverLetter });
}
