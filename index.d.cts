import type {
	Export,
	ExportInput,
	ImportExport,
	ImportExportInput,
} from "./index.js";

export type {Export, ExportInput, ImportExport, ImportExportInput};

/**
 * List the exports in the package at the given location
 *
 * This function defaults the `type` of the `input` to `"require"`.
 *
 * If the `package.json` doesn't exist, you can pass in a `package.json` object
 * in the `input`'s `packageJson` property.
 *
 * @param location Path to the `package.json` in which to locate exports
 * @param input Configuration
 */
export function listExports(
	location: string,
	input?: ImportExportInput
): Promise<Array<ImportExport>>;

/**
 * List the imports in the package at the given location
 *
 * This function defaults the `type` of the `input` to `"require"`.
 *
 * If the `package.json` doesn't exist, you can pass in a `package.json` object
 * in the `input`'s `packageJson` property.
 *
 * @param location Path to the `package.json` in which to locate imports
 * @param input Configuration
 */
export function listImports(
	location: string,
	input?: ImportExportInput
): Promise<Array<ImportExport>>;
