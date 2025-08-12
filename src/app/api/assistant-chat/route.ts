import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (process.env.FORCE_MOCK_AI === "1") {
      return NextResponse.json({ reply: "Mock: I can refine your bullets or tailor your cover letter. What would you like?" });
    }

    const sys = `You are Job PowerUp — a friendly, precise career assistant.
Use the provided context when helpful (resume improvements, cover letter, job description).
Give actionable suggestions. Keep answers concise unless asked for more. Use markdown for emphasis.`;

    const conv = [
      { role: "system", content: sys },
      { role: "system", content: `Context JSON: ${JSON.stringify(context || {})}` },
      ...(Array.isArray(messages) ? messages : []),
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: conv as any,
      temperature: 0.4,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "…";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Chat failed" }, { status: 500 });
  }
}
