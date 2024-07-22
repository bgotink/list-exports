// @ts-check

import {readFile} from "node:fs/promises";

import {globStream} from "glob";
import {pathToFileURL} from "node:url";

/**
 * @param {string | URL} location
 * @param {import('./index.js').ImportExportInput} [input]
 * @returns {Promise<Array<import('./index.js').ImportExport>>}
 */
export async function listExports(
	location,
	{
		type = "import",
		packageJson,
		environment = "node",
		extraConditions,
	} = {}
) {
	if (typeof location === "string") {
		location = pathToFileURL(location);
	}

	packageJson = await readPackageJson(location, packageJson);

	const conditions = getConditions(type, environment, extraConditions);

	const entries = getExportsEntries(
		/** @type {any} */ (packageJson).exports,
		false
	);

	if (entries.length === 0) {
		return [];
	}

	if (entries.some(hasPatternInEntry)) {
		return await listExportsWithPatterns(location, entries, conditions);
	} else {
		return listExportsWithoutPatterns(entries, conditions);
	}
}


/**
 * @param {string | URL} location
 * @param {import('./index.js').ImportExportInput} [input]
 * @returns {Promise<Array<import('./index.js').ImportExport>>}
 */
export async function listImports(
	location,
	{
		type = "import",
		packageJson,
		environment = "node",
		extraConditions,
	} = {}
) {
	if (typeof location === "string") {
		location = pathToFileURL(location);
	}

	packageJson = await readPackageJson(location, packageJson);

	const conditions = getConditions(type, environment, extraConditions);

	const entries = getExportsEntries(
		/** @type {any} */ (packageJson).imports,
		true
	);

	if (entries.length === 0) {
		return [];
	}

	if (entries.some(hasPatternInEntry)) {
		return await listExportsWithPatterns(location, entries, conditions);
	} else {
		return listExportsWithoutPatterns(entries, conditions);
	}
}

/**
 * @param {readonly [unknown, string, ...unknown[]]} entry
 */
function hasPatternInEntry([, key]) {
	return key.includes("*");
}

/**
 *
 * @param {URL} location
 * @param {unknown} packageJson
 * @returns {Promise<unknown>}
 */
async function readPackageJson(location, packageJson) {
	let hasReadLocation = false;

	if (packageJson === undefined) {
		packageJson = JSON.parse(await readFile(location, "utf-8"));
		hasReadLocation = true;
	}

	if (
		packageJson == null ||
		typeof packageJson !== "object" ||
		Array.isArray(packageJson)
	) {
		if (hasReadLocation) {
			throw new Error(
				`Invalid package.json at ${location}, expected the file to contain an object`
			);
		} else {
			throw new Error(
				`Invalid value for the packageJson option, expected an object`
			);
		}
	}

	return packageJson;
}

/**
 *
 * @param {import('./index.js').ImportExportInput['type'] & string | null} type
 * @param {import('./index.js').ImportExportInput['environment'] & string | null} environment
 * @param {import('./index.js').ImportExportInput['extraConditions']} extraConditions
 */
function getConditions(type, environment, extraConditions) {
	const conditions = new Set(extraConditions);

	if (type != null) {
		conditions.add(type);
		conditions.add("default");
	}

	if (environment != null) {
		conditions.add(environment);
	}

	return conditions;
}

/**
 * @param {any} exports
 * @param {boolean} isImports
 * @returns {Array<[string, string, any]>}
 */
function getExportsEntries(exports, isImports) {
	if (exports == null) {
		return [];
	}

	if (
		typeof exports === "string" ||
		exports === null ||
		Array.isArray(exports)
	) {
		if (isImports) {
			throw new Error("Malformed imports value, expected an object");
		}

		return [[".", ".", exports]];
	}

	const entries = Object.entries(exports);
	if (entries.length === 0) {
		return [];
	}

	if (!isImports) {
		const startsWithDot =
			entries[0][0] === "." || entries[0][0].startsWith("./");
		for (const [key] of entries.slice(1)) {
			if (startsWithDot !== (key === "." || key.startsWith("./"))) {
				throw new Error(
					"Malformed exports object, only some keys start with ./"
				);
			}
		}

		if (!startsWithDot) {
			return [[".", ".", exports]];
		}
	} else {
		for (const [key] of entries.slice(1)) {
			if (!key.startsWith("#")) {
				throw new Error(
					"Malformed imports object, some keys don't start with #"
				);
			}
		}
	}

	return entries.map(([key, e]) =>
		key.endsWith("/") ? [key, `${key}*`, `${e}*`] : [key, key, e]
	);
}

/**
 * @param {Array<[string, string, any]>} exports
 * @param {Set<string>} conditions
 * @returns {Array<import('./index.js').Export>}
 */
function listExportsWithoutPatterns(exports, conditions) {
	// This is the easy path, because we don't need to check for any globs and
	// we don't have to care about checking if a longer export key matches the
	// same export.

	return mapAndFilter(exports, ([registeredName, name, e]) => {
		const exportedPath = getExportedPath(e, conditions);

		return exportedPath == null
			? skip
			: {
					name,
					registeredName,
					path: exportedPath,
					registeredPath: exportedPath,
			  };
	});
}

/**
 * @param {URL} location
 * @param {Array<[string, string, any]>} exports
 * @param {Set<string>} conditions
 * @returns {Promise<Array<import('./index.js').Export>>}
 */
async function listExportsWithPatterns(location, exports, conditions) {
	// This is the hard path, we've got to loop the file system, and
	// we have to validate that exports we find with key X aren't
	// overwritten or blocked by another export

	/** @type {Set<string>} */
	const fixedKeys = new Set();
	/** @type {Map<string, [number, import('./index.js').Export | null]>} */
	const result = new Map();
	/** @type {Array<[string, string, string, string]>} */
	const starExports = [];
	/** @type {Array<[string, string, number]>} */
	const starExportsBlocked = [];
	for (const [registeredName, name, e] of exports) {
		const registeredPath = getExportedPath(e, conditions);
		const starIndex = name.indexOf("*");

		if (starIndex !== -1) {
			if (registeredPath != null) {
				starExports.push([
					registeredName,
					name.slice(0, starIndex),
					name.slice(starIndex + 1),
					registeredPath,
				]);
			} else {
				starExportsBlocked.push([
					name.slice(0, starIndex),
					name.slice(starIndex + 1),
					name.length,
				]);
			}

			continue;
		}

		fixedKeys.add(name);
		result.set(name, [
			name.length,
			registeredPath != null
				? {name, registeredName, path: registeredPath, registeredPath}
				: null,
		]);
	}

	await Promise.all(
		starExports.map(async ([registeredName, before, after, registeredPath]) => {
			const starIndex = registeredPath.indexOf("*");
			if (starIndex === -1) {
				throw new Error(
					`Malformed exports object, value must contain * if key contains *`
				);
			}

			const exportedBefore = registeredPath.slice(0, starIndex);
			const exportedAfter = registeredPath.slice(starIndex + 1);

			const patternLength = before.length + 1 + after.length;

			let patterns;
			if (exportedBefore.endsWith("/")) {
				if (exportedAfter.startsWith("/")) {
					patterns = [`${exportedBefore}**${exportedAfter}`];
				} else {
					patterns = [`${exportedBefore}**/*${exportedAfter}`];
				}
			} else {
				if (exportedAfter.startsWith("/")) {
					patterns = [`${exportedBefore}*/**${exportedAfter}`];
				} else {
					patterns = [
						`${exportedBefore}*${exportedAfter}`,
						`${exportedBefore}*/**/*${exportedAfter}`,
					];
				}
			}

			for await (const path of globStream(patterns, {
				cwd: new URL(".", location),
				posix: true,
				dot: true,
				dotRelative: true,
				nobrace: true,
				nodir: true,
				noext: true,
				ignore: ["node_modules/**", "**/node_modules/**"],
			})) {
				const key = `${before}${path.slice(
					exportedBefore.length,
					-exportedAfter.length || path.length
				)}${after}`;

				if (fixedKeys.has(key)) {
					// If a subpath matches both a fixed export and a star export, the
					// fixed export wins.
					continue;
				}

				const r = result.get(key);

				if (r == null || r[0] < patternLength) {
					result.set(key, [
						patternLength,
						{
							registeredName,
							registeredPath,
							name: key,
							path,
						},
					]);
				}
			}
		})
	);

	return mapAndFilter(result.values(), ([longestMatchingKeyLength, e]) => {
		if (!e) {
			return skip;
		}

		if (!fixedKeys.has(e.name)) {
			for (const [before, after, length] of starExportsBlocked) {
				if (
					length > longestMatchingKeyLength &&
					e.name.startsWith(before) &&
					e.name.endsWith(after)
				) {
					return skip;
				}
			}
		}

		return e;
	});
}

/**
 * @param {any} e
 * @param {Set<string>} conditions
 */
function getExportedPath(e, conditions) {
	if (e === null) {
		return null;
	}
	if (typeof e === "string") {
		return e;
	}
	if (Array.isArray(e)) {
		// TODO what to do here?
		return getExportedPath(e[0], conditions);
	}

	for (const [key, value] of Object.entries(e)) {
		if (conditions.has(key)) {
			return getExportedPath(value, conditions);
		}
	}

	return null;
}

/**
 * @template T, U
 * @param {Iterable<T>} input
 * @param {(value: T) => U | typeof skip} fn
 * @returns {Array<U>}
 */
function mapAndFilter(input, fn) {
	return Array.from(input, fn).filter(
		/** @returns {f is U} */ (f) => f !== skip
	);
}
const skip = Symbol();
