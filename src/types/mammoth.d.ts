declare module "mammoth" {
  const mammoth: {
    convertToHtml(
      input: { arrayBuffer: ArrayBuffer } | { path: string },
      options?: Record<string, any>
    ): Promise<{ value: string; messages?: any[] }>;
  };
  export = mammoth;
  export default mammoth;
}
