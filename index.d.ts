export interface ExportInput {
  packageJson?: unknown;
  type?: "import" | "require" | "default" | null;
  environment?: "node" | "browser" | null;
  extraConditions?: Array<string>;
}

export interface Export {
  name: string;
  path: string;
}

export function listExports(
  location: string,
  input?: ExportInput,
): Promise<Array<Export>>;
