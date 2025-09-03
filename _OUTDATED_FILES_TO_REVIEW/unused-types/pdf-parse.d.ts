declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    Trapped?: string;
  }

  interface PDFMetadata {
    _metadata?: any;
    Metadata?: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  function PDFParse(
    dataBuffer: Buffer | ArrayBuffer | Uint8Array,
    options?: PDFOptions
  ): Promise<PDFData>;

  export = PDFParse;
}

declare module 'pdf-parse/lib/pdf-parse' {
  export * from 'pdf-parse';
  import PDFParse from 'pdf-parse';
  export default PDFParse;
}