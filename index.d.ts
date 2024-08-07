/**
 * Input for the `listExports` and `listImports` functions
 */
export interface ImportExportInput {
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
	 *
	 * The list of options is not enforced via the typescript interface, check the [WinterCG's Runtime Keys](https://runtime-keys.proposal.wintercg.org/) for an overview of useful values to use here
	 */
	environment?: "node" | string | null;

	/**
	 * Extra conditions to support
	 */
	extraConditions?: Iterable<string>;
}

/**
 * @deprecated Renamed to {@link ImportExportInput}
 */
export type ExportInput = ImportExportInput;

export interface ImportExport {
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
	 * Path to the exported file, relative to the `location`.
	 */
	path: string;

	/**
	 * The export name as configured in the `package.json` file
	 *
	 * If the export contains `*`, this property will still contain the `*`. That
	 * means that if the `*` export matches multiple files, more than one `Export`
	 * will have the same `registeredName`.
	 */
	registeredName: string;

	/**
	 * The export path as configured in the `package.json` file
	 *
	 * If the export contains `*`, this property will still contain the `*`. That
	 * means that if the `*` export matches multiple files, more than one `Export`
	 * will have the same `registeredPath`.
	 */
	registeredPath: string;
}

/**
 * @deprecated Renamed to {@link ImportExport}
 */
export type Export = ImportExport;

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
	input?: ImportExportInput
): Promise<Array<ImportExport>>;

/**
 * List the imports in the package at the given location
 *
 * If the `package.json` doesn't exist, you can pass in a `package.json` object
 * in the `input`'s `packageJson` property.
 *
 * This function defaults the `type` of the `input` to `"import"`.
 *
 * @param location Path to the `package.json` in which to locate imports
 * @param input Configuration
 */
export function listImports(
	location: string,
	input?: ImportExportInput
): Promise<Array<ImportExport>>;
