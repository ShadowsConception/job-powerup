import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // needs Buffer

async function parsePdf(buf: Buffer): Promise<string> {
  // Lazy import avoids pulling test assets at build time
  const modAny: any =
    (await import("pdf-parse/lib/pdf-parse.js")).default ??
    (await import("pdf-parse")).default;
  const out = await modAny(buf);
  return (out?.text || "").trim();
}

async function parseDocx(buf: Buffer): Promise<string> {
  const mammoth: any = await import("mammoth");
  const res = await mammoth.extractRawText({ buffer: buf });
  return (res?.value || "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const lower = (file.name || "").toLowerCase();

    let text = "";
    if (file.type.includes("pdf") || lower.endsWith(".pdf")) {
      text = await parsePdf(buf);
    } else {
      text = await parseDocx(buf);
    }

    const chars = text.length;
    if (chars < 20) {
      return NextResponse.json({ error: "No readable text in file." }, { status: 400 });
    }

    return NextResponse.json({ chars, text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Validation failed" }, { status: 500 });
  }
}
