import {fileURLToPath} from "node:url";
import {test} from "uvu";
import * as assert from "uvu/assert";

import {listExports} from "../index.js";

const fixture = fileURLToPath(
  new URL("./fixture/package.json", import.meta.url),
);

function sortByName(arr) {
  return arr.sort((a, b) => a.name.localeCompare(b.name));
}

test("single", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./file.js",
          "./*.js": "./folder/*.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./file.js"},
      {name: "./file.js", path: "./folder/file.js"},
      {name: "./other.js", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );

  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./file.js",
          "./*": "./folder/*.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./file.js"},
      {name: "./file", path: "./folder/file.js"},
      {name: "./other", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );
});

test("slash fallback", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./file.js",
          "./": "./folder/*.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./file.js"},
      {name: "./file", path: "./folder/file.js"},
      {name: "./other", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );
});

test("multiple", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./file.js",
          "./*.js": "./folder/*.js",
          "./*": "./folder/*.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./file.js"},
      {name: "./file", path: "./folder/file.js"},
      {name: "./file.js", path: "./folder/file.js"},
      {name: "./other", path: "./folder/other.js"},
      {name: "./other.js", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );
});

test("overrides", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./source.js",
          "./file.js": "./file.js",
          "./*.js": "./folder/*.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./source.js"},
      {name: "./file.js", path: "./file.js"},
      {name: "./other.js", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );

  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./source.js",
          "./*e.js": "./internal/*e.js",
          "./*.js": "./folder/*.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./source.js"},
      {name: "./file.js", path: "./internal/file.js"},
      {name: "./other.js", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );

  assert.equal(
    sortByName(
      await listExports(fixture, {
        exports: {
          ".": "./source.js",
          "./*.js": "./folder/*.js",
          "./*e.js": "./internal/*e.js",
          "./package.json": "./package.json",
        },
      }),
    ),
    [
      {name: ".", path: "./source.js"},
      {name: "./file.js", path: "./internal/file.js"},
      {name: "./other.js", path: "./folder/other.js"},
      {name: "./package.json", path: "./package.json"},
    ],
  );
});

test.run();
