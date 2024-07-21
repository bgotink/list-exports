import type {Export, ExportInput} from "./index.js";

export type {Export, ExportInput};

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
	input?: ExportInput
): Promise<Array<Export>>;
