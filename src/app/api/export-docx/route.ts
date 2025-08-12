import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { title = "Document", sections = [] } = await req.json() as {
      title?: string;
      sections?: { heading?: string; body: string }[];
    };

    const children: Paragraph[] = [
      new Paragraph({ text: `Job PowerUp — ${title}`, heading: HeadingLevel.TITLE }),
      new Paragraph(""),
    ];

    for (const s of sections) {
      if (s.heading) children.push(new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_2 }));
      const lines = String(s.body || "")
        .replace(/\r\n/g, "\n")
        .split("\n");
      for (const line of lines) {
        children.push(new Paragraph({ children: [new TextRun(line)] }));
      }
      children.push(new Paragraph(""));
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${title.replace(/\s+/g, "_").toLowerCase()}.docx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate DOCX" }, { status: 500 });
  }
}
