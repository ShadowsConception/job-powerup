import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const FORCE_MOCK = process.env.FORCE_MOCK_AI === "true";

export type GenResult = {
  summary: string;
  bullets: string[];
  coverLetter: string;
  interviewKit: { q: string; answer_outline: string[] }[];
  improvements: string[]; // NEW
  warnings?: string[];
};

function mockResult(): GenResult {
  return {
    summary: "Motivated candidate with initiative and strong communication skills.",
    bullets: [
      "Managed small resale operation with consistent profit margins.",
      "Coordinated customer outreach to grow monthly sales.",
      "Tracked inventory/ROI and optimized pricing.",
      "Delivered reliable service; handled payments and receipts.",
    ],
    coverLetter:
      "Dear Hiring Manager,\nI’m excited to apply. Running my own resale operation taught me initiative, ownership, and customer service. I’m eager to bring that drive to your team…",
    interviewKit: [
      { q: "Tell me about a time you solved a tricky problem.", answer_outline: ["S", "T", "A", "R"] },
      { q: "How do you prioritize tasks?", answer_outline: ["Urgency/impact", "Plan", "Execute", "Review"] },
      { q: "Describe a challenge with a customer.", answer_outline: ["Listen", "Clarify", "Offer options", "Follow-up"] },
    ],
    improvements: [
      "Add 2–3 quantified bullets (%, $, time saved).",
      "Highlight tools/skills from the posting (e.g., Excel, POS, CRM).",
      "Move the most relevant experience to the top.",
    ],
    warnings: FORCE_MOCK ? ["FORCE_MOCK_AI=true (dev mode)"] : undefined,
  };
}

async function withBackoff<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e: any) {
      lastErr = e;
      const status = e?.status || e?.response?.status;
      if (status === 429 || (status >= 500 && status < 600)) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function generateJobAssets(resumeText: string, jobDesc: string): Promise<GenResult> {
  if (FORCE_MOCK || !apiKey) return mockResult();

  const client = new OpenAI({ apiKey });

  const jd = jobDesc.slice(0, 6000);
  const rz = resumeText.slice(0, 6000);

  const prompt = `
You are a career coach. Given RESUME_TEXT and JOB_DESCRIPTION:

- Never fabricate experience or tools not in the resume.
- Prefer quantified impact when present.
- Return strict JSON only.

RESUME_TEXT:
<<<${rz}>>>

JOB_DESCRIPTION:
<<<${jd}>>>

TASKS:
1) Write a 2–3 sentence professional summary tailored to the job.
2) Write 6–8 truthful résumé bullet points aligned to the job.
3) Write a 180–220 word cover letter tailored to the role.
4) Provide 10 interview questions with 3–5 bullet answer outlines (STAR-friendly).
5) Provide a list "improvements" with 5–8 specific, actionable suggestions to adjust THIS resume for THIS job. Focus on: missing keywords, sections to reorder, bullets to add/trim, quantification ideas, skills to emphasize.

Return JSON:
{
  "summary": "...",
  "bullets": ["..."],
  "coverLetter": "...",
  "interviewKit": [{ "q": "...", "answer_outline": ["..."] }],
  "improvements": ["..."]
}
`;

  try {
    const completion = await withBackoff(async () => {
      return client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1400,
      });
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(raw) as GenResult;
  } catch (e: any) {
    const status = e?.status || e?.response?.status;
    if (status === 429) {
      const res = mockResult();
      res.warnings = [...(res.warnings || []), "OpenAI quota exceeded — showing mock output."];
      return res;
    }
    throw e;
  }
}
