import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ctype = req.headers.get("content-type") || "";
    if (!ctype.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), { status: 415 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const jobDescription = (form.get("jobDescription") as string | null) || "";

    if (!file) return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    if (!jobDescription.trim()) return new Response(JSON.stringify({ error: "Missing jobDescription" }), { status: 400 });

    // Parse PDF/DOCX to plain text
    const buf = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();

    let resumeText = "";
    if (name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buf);
      resumeText = (data.text || "").trim();
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: buf });
      resumeText = (result.value || "").trim();
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type. Use PDF or DOCX." }), { status: 400 });
    }

    if (!resumeText) {
      return new Response(JSON.stringify({ error: "Could not extract text from résumé." }), { status: 422 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const prompt = `You are a hiring manager. Compare the RESUME to the JOB DESCRIPTION and list concrete, résumé-focused improvements only (skills to add, keywords to mirror, bullets to rewrite with metrics, section order tweaks). Output 6-10 bullets, terse and actionable.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const improvements = resp.choices[0]?.message?.content?.trim() || "";
    return Response.json({ improvements });
  } catch (e) {
    console.error("analyze error:", e);
    return Response.json({ error: "Analyze failed" }, { status: 500 });
  }
}
