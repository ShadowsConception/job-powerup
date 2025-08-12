import OpenAI from "openai";

export const runtime = "nodejs";

type QuizItem = { question: string; idealAnswer: string };

export async function POST(req: Request) {
  try {
    const { jobDescription = "", count = 10 } = await req.json();
    if (!jobDescription.trim()) {
      return Response.json({ error: "Missing jobDescription" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const jd = sanitizeJD(jobDescription, 4000); // trim to avoid token bloat

    const prompt = `
You generate interview questions.

Return ONLY valid, minified JSON in this exact shape (NO markdown, NO backticks, NO commentary):
{"items":[{"question":"...","idealAnswer":"..."}, ...]}

Rules:
- Exactly ${count} items if possible.
- Questions: mix behavioral, situational, and role-specific.
- "idealAnswer" must be a concise outline (bullets allowed, keep under 80-120 words).
- Use plain text characters only.
- Do NOT include any keys other than "items", "question", "idealAnswer".

JOB DESCRIPTION:
${jd}
`.trim();

    // Try up to 2 attempts in case the model returns junk
    const items = await generateQuizJSON(openai, prompt, 2);
    if (!items.length) {
      return Response.json({ error: "Model returned no items" }, { status: 502 });
    }

    return Response.json({ items });
  } catch (e) {
    console.error("interview-quiz error:", e);
    return Response.json({ error: "Quiz build failed" }, { status: 500 });
  }
}

function sanitizeJD(input: string, maxChars: number): string {
  const s = input.replace(/\u0000/g, "");
  return s.length > maxChars ? s.slice(0, maxChars) + "\n...[truncated]..." : s;
}

async function generateQuizJSON(openai: OpenAI, prompt: string, attempts = 1): Promise<QuizItem[]> {
  for (let i = 0; i < attempts; i++) {
    const raw = await callModel(openai, prompt);
    const parsed = safeParseJSON(raw);
    if (parsed.items && Array.isArray(parsed.items)) {
      const cleaned = parsed.items
        .filter((x: any) => x && typeof x.question === "string" && typeof x.idealAnswer === "string")
        .map((x: any) => ({
          question: x.question.trim(),
          idealAnswer: x.idealAnswer.trim(),
        }));
      if (cleaned.length) return cleaned;
    }
  }
  return [];
}

async function callModel(openai: OpenAI, prompt: string): Promise<string> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 900, // enough for ~10 Q&As in compact form
  });
  return resp.choices[0]?.message?.content ?? "";
}

function safeParseJSON(s: string): any {
  // extract the biggest {...} or [...] block if extra text sneaks in
  const objIdxStart = s.indexOf("{");
  const objIdxEnd = s.lastIndexOf("}");
  const arrIdxStart = s.indexOf("[");
  const arrIdxEnd = s.lastIndexOf("]");

  const candidates: string[] = [];
  if (objIdxStart !== -1 && objIdxEnd > objIdxStart) candidates.push(s.slice(objIdxStart, objIdxEnd + 1));
  if (arrIdxStart !== -1 && arrIdxEnd > arrIdxStart) candidates.push(s.slice(arrIdxStart, arrIdxEnd + 1));

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      // If it was an array, wrap to expected shape
      if (Array.isArray(parsed)) return { items: parsed };
      return parsed;
    } catch {
      // try next candidate
    }
  }

  // last-ditch: try parsing the original string directly
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
