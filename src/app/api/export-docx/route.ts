import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";

export const runtime = "nodejs"; // docx requires Node, not Edge

type Section = { heading?: string; body: string };
type Payload = { title?: string; sections: Section[] };

// --- helpers ---
function normalize(s: string) {
  return s.replace(/\r\n/g, "\n").replace(/\u00A0/g, " ").trim();
}
function stripOuterQuotes(s: string) {
  const q = (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("“") && s.endsWith("”"));
  return q ? s.slice(1, -1).trim() : s;
}
function safeFilename(name: string) {
  return (name || "document").toLowerCase().replace(/[^\w.-]+/g, "_") + ".docx";
}
function boldRunsFromMarkdown(line: string): TextRun[] {
  // very small "**bold**" parser
  const parts = line.split("**");
  const runs: TextRun[] = [];
  for (let i = 0; i < parts.length; i++) {
    const text = parts[i];
    if (!text) continue;
    const isBold = i % 2 === 1;
    runs.push(new TextRun({ text, bold: isBold }));
  }
  return runs.length ? runs : [new TextRun(line)];
}
function blockToParagraphs(block: string): Paragraph[] {
  const trimmed = block.trim();
  if (!trimmed) return [];

  // bullet list if each non-empty line starts with a bullet marker
  const lines = trimmed.split("\n").filter(Boolean);
  const isBulleted = lines.every((l) => /^(\-|\*|•)\s+/.test(l));

  if (isBulleted) {
    return lines.map((l) => {
      const text = l.replace(/^(\-|\*|•)\s+/, "");
      return new Paragraph({
        children: boldRunsFromMarkdown(text),
        bullet: { level: 0 },
      });
    });
  }

  // headings
  if (/^##\s+/.test(trimmed)) {
    return [
      new Paragraph({
        text: trimmed.replace(/^##\s+/, ""),
        heading: HeadingLevel.HEADING_2,
      }),
    ];
  }
  if (/^#\s+/.test(trimmed)) {
    return [
      new Paragraph({
        text: trimmed.replace(/^#\s+/, ""),
        heading: HeadingLevel.HEADING_1,
      }),
    ];
  }

  // normal paragraph (collapse single newlines into spaces)
  const singleLine = lines.join(" ");
  return [new Paragraph({ children: boldRunsFromMarkdown(singleLine) })];
}

function markdownToParagraphs(md: string): Paragraph[] {
  const cleaned = normalize(stripOuterQuotes(md));
  const blocks = cleaned.split(/\n{2,}/);
  const paras: Paragraph[] = [];
  for (const b of blocks) paras.push(...blockToParagraphs(b));
  return paras;
}

// --- Route handler ---
export async function POST(req: Request) {
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (payload.title || "Export").trim();
  const sections = Array.isArray(payload.sections) ? payload.sections : [];

  if (!sections.length) {
    return NextResponse.json({ error: "No sections provided" }, { status: 400 });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // optional document title
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
          }),
          ...sections.flatMap((s) => {
            const kids: Paragraph[] = [];
            const heading = (s.heading || "").trim();
            const body = (s.body || "").trim();

            if (heading) {
              kids.push(
                new Paragraph({
                  text: heading,
                  heading: HeadingLevel.HEADING_2,
                })
              );
            }
            if (body) {
              kids.push(...markdownToParagraphs(body));
            }
            // add a bit of space after each section
            kids.push(new Paragraph({ text: "" }));
            return kids;
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc); // Node Buffer
  // Convert Buffer -> ArrayBuffer to appease Web Response typing
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeFilename(title)}"`,
      "Cache-Control": "no-store",
    },
  });
}
