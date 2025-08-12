import { NextRequest, NextResponse } from "next/server";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

/** Minimal markdown → docx runs (bold, italic, bullets, headings) */
function mdLineToRuns(line: string): TextRun[] {
  const runs: TextRun[] = [];
  // Replace **bold** and *italic*
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|[^*`]+)/g;
  const parts = line.match(regex) || [line];
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      tokens.push({ text: part.slice(2, -2), bold: true });
    } else if (part.startsWith("*") && part.endsWith("*")) {
      tokens.push({ text: part.slice(1, -1), italics: true });
    } else if (part.startsWith("`") && part.endsWith("`")) {
      tokens.push({ text: part.slice(1, -1) });
    } else {
      tokens.push({ text: part });
    }
  }
  for (const t of tokens) {
    runs.push(new TextRun({ text: t.text, bold: !!(t as any).bold, italics: !!(t as any).italics }));
  }
  return runs;
}

function mdToParagraphs(md: string): Paragraph[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const paras: Paragraph[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line) { paras.push(new Paragraph("")); continue; }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const heading =
        level === 1 ? HeadingLevel.HEADING_1 :
        level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      paras.push(new Paragraph({ heading, children: mdLineToRuns(text) }));
      continue;
    }

    // Bullets
    if (/^[-*]\s+/.test(line)) {
      paras.push(
        new Paragraph({
          bullet: { level: 0 },
          children: mdLineToRuns(line.replace(/^[-*]\s+/, "")),
        })
      );
      continue;
    }

    // Normal paragraph
    paras.push(new Paragraph({ children: mdLineToRuns(line) }));
  }
  return paras;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept either {title, sections:[{heading, body}]} OR results payload
    const title: string = body.title || "Job PowerUp";
    const sections: Array<{ heading: string; body: string }> =
      body.sections ||
      [
        { heading: "Resume Improvements", body: body.improvements || "" },
        { heading: "Cover Letter", body: body.coverLetter || "" },
      ];

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph(""),
            ...sections.flatMap((s) => [
              new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_1 }),
              ...mdToParagraphs(String(s.body || "")),
              new Paragraph(""),
            ]),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${title.replace(/[^\w.-]+/g, "_").toLowerCase()}.docx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
