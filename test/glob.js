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
				packageJson: {

					exports: {
						".": "./file.js",
						"./*.js": "./folder/*.js",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./file.js"},
      {name: "./file.js", registeredExport: './*.js', path: "./folder/file.js"},
      {name: "./other.js", registeredExport: './*.js', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );

  assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./file.js",
						"./*": "./folder/*.js",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./file.js"},
      {name: "./file", registeredExport: './*', path: "./folder/file.js"},
      {name: "./other", registeredExport: './*', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );
});

test("slash fallback", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./file.js",
						"./": "./folder/",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./file.js"},
      {name: "./file.js", registeredExport: './', path: "./folder/file.js"},
      {name: "./other.js", registeredExport: './', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );
});

test("multiple", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./file.js",
						"./*.js": "./folder/*.js",
						"./*": "./folder/*.js",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./file.js"},
      {name: "./file", registeredExport: './*', path: "./folder/file.js"},
      {name: "./file.js", registeredExport: './*.js', path: "./folder/file.js"},
      {name: "./other", registeredExport: './*', path: "./folder/other.js"},
      {name: "./other.js", registeredExport: './*.js', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );
});

test("overrides", async () => {
  assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./source.js",
						"./file.js": "./file.js",
						"./*.js": "./folder/*.js",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./source.js"},
      {name: "./file.js", registeredExport: './file.js', path: "./file.js"},
      {name: "./other.js", registeredExport: './*.js', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );

  assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./source.js",
						"./*e.js": "./internal/*e.js",
						"./*.js": "./folder/*.js",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./source.js"},
      {name: "./file.js", registeredExport: './*e.js', path: "./internal/file.js"},
      {name: "./other.js", registeredExport: './*.js', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );

  assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./source.js",
						"./*.js": "./folder/*.js",
						"./*e.js": "./internal/*e.js",
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./source.js"},
      {name: "./file.js", registeredExport: './*e.js', path: "./internal/file.js"},
      {name: "./other.js", registeredExport: './*.js', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );
});

test('deep', async () => {
	assert.equal(
    sortByName(
      await listExports(fixture, {
				packageJson: {

					exports: {
						".": "./source.js",
						"./*.js": "./*.js",
						"./internal/*": null,
						"./package.json": "./package.json",
					},
				}
      }),
    ),
    [
      {name: ".", registeredExport: '.', path: "./source.js"},
      {name: "./file.js", registeredExport: './*.js', path: "./file.js"},
      {name: "./folder/file.js", registeredExport: './*.js', path: "./folder/file.js"},
      {name: "./folder/other.js", registeredExport: './*.js', path: "./folder/other.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
      {name: "./source.js", registeredExport: './*.js', path: "./source.js"},
    ],
  );
})

test.run();
