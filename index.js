// @ts-check

import {readFile} from "node:fs/promises";
import {dirname} from "node:path";

import {globStream} from "glob";

/**
 * @param {string} location
 * @param {any} packageJson
 * @param {import('./index.js').ExportInput} [input]
 * @returns {Promise<Array<import('./index.js').Export>>}
 */
export async function listExports(
  location,
  {
    type = "import",
    packageJson,
    environment = "node",
    extraConditions = [],
  } = {},
) {
  if (packageJson === undefined) {
    packageJson = JSON.parse(await readFile(location, "utf-8"));
  }

  if (packageJson == null || typeof packageJson !== "object") {
    return [];
  }

  const conditions = new Set(extraConditions);
  if (type != null) {
    conditions.add(type);
    conditions.add("default");
  }
  if (environment != null) {
    conditions.add(environment);
  }

  const entries = getExportsEntries(packageJson.exports);
  if (entries.length === 0) {
    return [];
  }

  if (entries.every(([entry]) => !entry.includes("*"))) {
    return listExportsWithoutPatterns(entries, conditions);
  } else {
    return await listExportsWithPatterns(location, entries, conditions);
  }
}

/**
 * @param {any} exports
 * @returns {Array<[string, any]>}
 */
function getExportsEntries(exports) {
  if (exports == null) {
    return [];
  }

  if (
    typeof exports === "string" ||
    exports === null ||
    Array.isArray(exports)
  ) {
    return [[".", exports]];
  }

  const entries = Object.entries(exports);
  if (entries.length === 0) {
    return [];
  }

  const startsWithDot = entries[0][0] === "." || entries[0][0].startsWith("./");
  for (const [key] of entries.slice(1)) {
    if (startsWithDot !== (key === "." || key.startsWith("./"))) {
      throw new Error("Malformed exports object, only some keys start with ./");
    }
  }

  if (!startsWithDot) {
    return [[".", exports]];
  }

  return entries.map(([key, e]) => [key.endsWith("/") ? `${key}*` : key, e]);
}

/**
 * @param {Array<[string, any]>} exports
 * @param {Set<string>} conditions
 * @returns {Array<import('./index.js').Export>}
 */
function listExportsWithoutPatterns(exports, conditions) {
  // This is the easy path, because we don't need to check for any globs and
  // we don't have to care about checking if a longer export key matches the
  // same export.

  return mapAndFilter(exports, ([key, e]) => {
    const exportedPath = getExportedPath(e, conditions);

    return exportedPath == null ? skip : {name: key, path: exportedPath};
  });
}

/**
 * @param {string} location
 * @param {Array<[string, any]>} exports
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
  /** @type {Array<[string, string, string]>} */
  const starExports = [];
  /** @type {Array<[string, string, number]>} */
  const starExportsBlocked = [];
  for (const [key, e] of exports) {
    const exportedPath = getExportedPath(e, conditions);
    const starIndex = key.indexOf("*");

    if (starIndex !== -1) {
      if (exportedPath != null) {
        starExports.push([
          key.slice(0, starIndex),
          key.slice(starIndex + 1),
          exportedPath,
        ]);
      } else {
        starExportsBlocked.push([
          key.slice(0, starIndex),
          key.slice(starIndex + 1),
          key.length,
        ]);
      }

      continue;
    }

    fixedKeys.add(key);
    result.set(key, [
      key.length,
      exportedPath != null ? {name: key, path: exportedPath} : null,
    ]);
  }

  await Promise.all(
    starExports.map(async ([before, after, exportedPath]) => {
      const starIndex = exportedPath.indexOf("*");
      if (starIndex === -1) {
        throw new Error(
          `Malformed exports object, value must contain * if key contains *`,
        );
      }

      const exportedBefore = exportedPath.slice(0, starIndex);
      const exportedAfter = exportedPath.slice(starIndex + 1);

      const patternLength = before.length + 1 + after.length;

      for await (const path of globStream(
        `${exportedBefore}**${exportedAfter}`,
        {
          cwd: dirname(location),
          posix: true,
          dot: true,
          dotRelative: true,
          nobrace: true,
          nodir: true,
          noext: true,
          ignore: ["node_modules/**", "**/node_modules/**"],
        },
      )) {
        const key = `${before}${path.slice(
          exportedBefore.length,
          -exportedAfter.length,
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
              name: key,
              path,
            },
          ]);
        }
      }
    }),
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
    /** @returns {f is U} */ (f) => f !== skip,
  );
}
const skip = Symbol();
