// src/lib/extractText.ts
// Node-only helper to read PDF/DOCX resume text.
// Uses dynamic imports so you don't need type packages.
export const runtime = "nodejs";

export async function extractTextFromFile(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";

  const isPdf = type.includes("pdf") || name.endsWith(".pdf");
  const isDocx =
    type.includes("word") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc");

  if (isPdf) {
    const pdfParse = (await import("pdf-parse")).default as any;
    const data = await pdfParse(buf);
    const text = String(data?.text || "").replace(/\r\n/g, "\n").trim();
    return { text, chars: text.length };
  }

  if (isDocx) {
    const mammoth = (await import("mammoth")) as any;
    const { value } = await mammoth.extractRawText({ buffer: buf });
    const text = String(value || "").replace(/\r\n/g, "\n").trim();
    return { text, chars: text.length };
  }

  throw new Error("Unsupported file type. Please upload PDF or DOCX.");
}
