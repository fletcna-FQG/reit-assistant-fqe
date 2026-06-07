declare module 'html-to-docx' {
  type HtmlToDocxOptions = {
    table?: { row?: { cantSplit?: boolean } };
    footer?: boolean;
    pageNumber?: boolean;
  };

  export default function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString: string | null,
    options?: HtmlToDocxOptions,
  ): Promise<ArrayBuffer | Buffer>;
}
