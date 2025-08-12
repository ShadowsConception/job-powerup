import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();

    let text = "";

    if (name.endsWith(".pdf")) {
      // lazy import to keep cold starts small
      const pdfParse = (await import("pdf-parse")).default;
      const out = await pdfParse(buf).catch(() => null);
      text = out?.text?.trim() || "";
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const out = await mammoth.extractRawText({ buffer: buf }).catch(() => null);
      text = (out as any)?.value?.trim?.() || "";
    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload a PDF or DOCX Resume." }, { status: 400 });
    }

    const chars = text.length;

    if (chars < 20) {
      return NextResponse.json(
        { error: "We couldn't extract readable text from that file. Try another Resume or export to PDF.", chars },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, chars });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Validation failed." }, { status: 500 });
  }
}
