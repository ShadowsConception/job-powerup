// src/app/api/cover-letter/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractTextFromFile } from "@/lib/extractText";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // prefer already-extracted resume text if the client sends it (optional)
    const resumeTextFromClient = String(form.get("resumeText") || "");

    const file = form.get("file") as File | null;
    const jobDescription = String(form.get("jobDescription") || "");
    if (!file && !resumeTextFromClient.trim()) {
      return NextResponse.json({ error: "Missing resume file or text" }, { status: 400 });
    }
    if (!jobDescription.trim()) {
      return NextResponse.json({ error: "Missing job description" }, { status: 400 });
    }

    // 1) Get resume text
    let resumeText = resumeTextFromClient.trim();
    if (!resumeText) {
      const { text } = await extractTextFromFile(file as File);
      resumeText = text;
    }
    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json({ error: "Could not read enough text from the resume." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2) Extract profile & highlights (JSON)
    const extractProfile = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract precise contact details and relevant highlights from the resume for the given job. No hallucinations. Use empty strings if unknown.",
        },
        {
          role: "user",
          content: [
            "Return JSON with keys:",
            "- fullName",
            "- addressLine1",
            "- addressLine2",
            "- phone",
            "- email",
            "- hiringManagerGuess",
            "- companyGuess",
            "- companyAddress",
            "- topAchievements (array; max 3; concise, include metrics if present)",
            "- topSkills (array; max 8; relevant to JD)",
            "",
            "RESUME_TEXT:",
            resumeText.slice(0, 15000),
            "",
            "JOB_DESCRIPTION:",
            jobDescription.slice(0, 8000),
          ].join("\n"),
        },
      ],
    });

    const raw = extractProfile.choices[0]?.message?.content || "{}";
    let profile: any;
    try {
      profile = JSON.parse(raw);
    } catch {
      profile = {};
    }
    const p = {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      phone: "",
      email: "",
      hiringManagerGuess: "",
      companyGuess: "",
      companyAddress: "",
      topAchievements: [] as string[],
      topSkills: [] as string[],
      ...profile,
    };

    // 3) Compose cover letter in DOCX-style layout (plain text with blank lines)
    const layoutSpec = `
FORMAT STRICTLY (omit any unknown line instead of placeholders):

[Full Name]
[Address line 1]
[Address line 2]
[Phone]  [Email]

[Today’s Date spelled out, e.g., September 12, 2025]

[Hiring Manager's Name]
[Company Name]
[Company Address]

Dear [Hiring Manager's Name],

Paragraph 1: concise hook naming the role and 1–2 strengths.

Paragraph 2–3: align resume achievements/skills to JD requirements using concrete results and metrics when present. Prose only (no bullets).

Closing: enthusiasm + call to action.

Warm regards,

[Full Name]
`.trim();

    const compose = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: "You are an expert cover-letter writer for US audiences." },
        {
          role: "user",
          content: [
            "Write a professional cover letter following the exact layout below.",
            "Constraints:",
            "- 275–425 words",
            "- Plain text; use blank lines between blocks",
            "- Never output bracketed placeholders; if a value is missing, omit that line entirely",
            "",
            "LAYOUT SPEC:",
            layoutSpec,
            "",
            "PROFILE JSON:",
            JSON.stringify(p),
            "",
            "JOB DESCRIPTION:",
            jobDescription.slice(0, 8000),
            "",
            "RESUME TEXT:",
            resumeText.slice(0, 15000),
          ].join("\n"),
        },
      ],
    });

    const coverLetter = (compose.choices[0]?.message?.content || "").trim();
    return NextResponse.json({ coverLetter });
  } catch (err: any) {
    console.error("/api/cover-letter error", err);
    return NextResponse.json({ error: "cover-letter generation failed" }, { status: 500 });
  }
}
