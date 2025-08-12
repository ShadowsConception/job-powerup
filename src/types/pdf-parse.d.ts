// Minimal shims so TS is happy with dynamic imports of pdf-parse

declare module "pdf-parse" {
  export type PdfParseResult = {
    text: string;
    numpages?: number;
    info?: any;
    metadata?: any;
    version?: string;
  };
  const pdfParse: (data: Buffer | Uint8Array | ArrayBuffer) => Promise<PdfParseResult>;
  export = pdfParse;
  export default pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export = pdfParse;
  export default pdfParse;
}
