export type DocumentationExportTarget = "notion" | "google_docs";

export class DocumentationExportError extends Error {
  public readonly target: DocumentationExportTarget;
  public readonly code: "api_error" | "timeout";

  constructor(
    target: DocumentationExportTarget,
    code: "api_error" | "timeout",
    message: string,
  ) {
    super(message);
    this.name = "DocumentationExportError";
    this.target = target;
    this.code = code;
  }
}

export interface DocumentationExportAdapterPort {
  exportToNotion(payload: {
    clientId: string;
    title: string;
    markdown: string;
    requestId: string;
  }): Promise<{ documentUrl: string }>;
  exportToGoogleDocs(payload: {
    clientId: string;
    title: string;
    markdown: string;
    requestId: string;
  }): Promise<{ documentUrl: string }>;
}

export class DocumentationExportAdapter implements DocumentationExportAdapterPort {
  async exportToNotion(payload: {
    clientId: string;
    title: string;
    markdown: string;
    requestId: string;
  }): Promise<{ documentUrl: string }> {
    const slug = this.slugify(`${payload.clientId}-${payload.requestId}-${payload.title}`);
    return {
      documentUrl: `https://www.notion.so/${slug}`,
    };
  }

  async exportToGoogleDocs(payload: {
    clientId: string;
    title: string;
    markdown: string;
    requestId: string;
  }): Promise<{ documentUrl: string }> {
    const slug = this.slugify(`${payload.clientId}-${payload.requestId}-${payload.title}`);
    return {
      documentUrl: `https://docs.google.com/document/d/${slug}/edit`,
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }
}
