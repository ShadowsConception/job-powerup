declare module "mammoth" {
  type Input =
    | { arrayBuffer: ArrayBuffer }
    | { path: string }
    | { buffer: Buffer | Uint8Array | ArrayBuffer };

  type ConvertResult = { value: string; messages?: any[] };

  const mammoth: {
    convertToHtml(input: Input, options?: Record<string, any>): Promise<ConvertResult>;
    extractRawText(input: Input, options?: Record<string, any>): Promise<ConvertResult>;
  };

  export = mammoth;
  export default mammoth;
}
