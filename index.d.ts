/**
 * Input for the `listExports` function
 */
export interface ExportInput {
	/**
	 * `package.json` object
	 *
	 * If this object isn't passed, the `location` file will be read and used
	 * instead.
	 */
  packageJson?: unknown;

	/**
	 * Enable/disable export conditions related to import type
	 *
	 * "default" only supports the "default" key
	 * "import" supports the "import" and "default" keys
	 * "require" supports the "require" and "default" keys
	 * null supports no keys
	 *
	 * If no value is passed, the value will default to "import" if this package
	 * is imported, and "require" if this package is required.
	 */
  type?: "import" | "require" | "default" | null;

	/**
	 * Environment key to support while resolving
	 *
	 * Defaults to "node" if not passed, set to null to not support any
	 * environment-based export condition.
	 */
  environment?: "node" | "browser" | null;

	/**
	 * Extra conditions to support
	 */
  extraConditions?: Iterable<string>;
}

export interface Export {
	/**
	 * The export path as used to import the export
	 *
	 * If the name is `'./deep/export'` and the package is named `pkg`, the export
	 * can be imported as `pkg/deep/export`.
	 *
	 * The name of the main export is `'.'`, not `''`.
	 */
  name: string;

	/**
	 * The export path as configured in the `package.json` file
	 *
	 * If the export contains `*`, this property will still contain the `*`. That
	 * means that if the `*` export matches multiple files, more than one `Export`
	 * will have the same `registeredExport`.
	 */
	registeredExport: string;

	/**
	 * Path to the exported file, relative to the `location`.
	 */
  path: string;
}

/**
 * List the exports in the package at the given location
 *
 * If the `package.json` doesn't exist, you can pass in a `package.json` object
 * in the `input`'s `packageJson` property.
 *
 * This function defaults the `type` of the `input` to `"import"`.
 *
 * @param location Path to the `package.json` in which to locate exports
 * @param input Configuration
 */
export function listExports(
  location: string,
  input?: ExportInput,
): Promise<Array<Export>>;
