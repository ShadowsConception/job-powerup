import { NextRequest, NextResponse } from "next/server";
import * as pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

async function readFile(file: File): Promise<{ text: string; chars: number }> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
    const out = await pdf(buf);
    const text = (out.text || "").trim();
    return { text, chars: text.length };
  }
  // docx
  const res = await mammoth.extractRawText({ buffer: buf });
  const text = (res.value || "").trim();
  return { text, chars: text.length };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const { text, chars } = await readFile(file);
    if (!chars || chars < 20) return NextResponse.json({ error: "No readable text in file." }, { status: 400 });

    return NextResponse.json({ chars, text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Validation failed" }, { status: 500 });
  }
}
