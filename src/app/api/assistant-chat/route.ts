import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (process.env.FORCE_MOCK_AI === "1") {
      return NextResponse.json({ reply: "Mock: I’ll be candid—tell me what you want to improve and I’ll suggest edits." });
    }

    const sys = `You are Job PowerUp — a friendly, *honest* career assistant.
- Be candid about uncertainty: say "I don't know" or "I can't verify that" when appropriate.
- Prefer concise, actionable advice. Use markdown (**bold**, lists) sparingly but clearly.
- If assumptions are needed, call them out. Never invent facts (companies, pay, titles).
- Use supplied context (resume improvements, cover letter, job description) to tailor responses.
- If the user pastes content, suggest concrete rewrites with examples.`;

    const conv = [
      { role: "system", content: sys },
      { role: "system", content: `Context JSON: ${JSON.stringify(context || {})}` },
      ...(Array.isArray(messages) ? messages : []),
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: conv as any,
      temperature: 0.35,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "…";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Chat failed" }, { status: 500 });
  }
}
