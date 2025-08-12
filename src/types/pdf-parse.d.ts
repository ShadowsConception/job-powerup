declare module "pdf-parse" {
  export interface PdfParseResult {
    text: string;
    // add more fields if you use them:
    // numpages?: number;
    // info?: Record<string, unknown>;
    // metadata?: unknown;
  }

  const pdfParse: (data: ArrayBuffer | Uint8Array | Buffer) => Promise<PdfParseResult>;
  export default pdfParse;
}
