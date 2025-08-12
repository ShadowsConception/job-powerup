export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return new Response(JSON.stringify({ error: "No file" }), { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();

    let text = "";
    if (name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buf);
      text = data.text || "";
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value || "";
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type" }), { status: 400 });
    }

    return new Response(JSON.stringify({ text }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Parse failed" }), { status: 500 });
  }
}
