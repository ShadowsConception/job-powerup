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

    const prompt = `Write a one-page cover letter tailored to this JOB. Use a confident, warm tone, quantify impact where possible, and align my experience to the must-haves. Use a simple header with my name as a placeholder. Do not invent employers or dates. Return plain text.

JOB:
${jobDescription}

RESUME:
${resumeText}`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const coverLetter = resp.choices[0]?.message?.content?.trim() || "";
    return Response.json({ coverLetter });
  } catch (e) {
    console.error("cover-letter error:", e);
    return Response.json({ error: "Cover letter failed" }, { status: 500 });
  }
}
