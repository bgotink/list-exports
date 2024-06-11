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
      {name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"},
      {name: "./file.js", registeredName: './*.js', path: "./folder/file.js", registeredPath: "./folder/*.js"},
      {name: "./other.js", registeredName: './*.js', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"},
      {name: "./file", registeredName: './*', path: "./folder/file.js", registeredPath: "./folder/*.js"},
      {name: "./other", registeredName: './*', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"},
      {name: "./file.js", registeredName: './', path: "./folder/file.js", registeredPath: "./folder/*"},
      {name: "./other.js", registeredName: './', path: "./folder/other.js", registeredPath: "./folder/*"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"},
      {name: "./file", registeredName: './*', path: "./folder/file.js", registeredPath: "./folder/*.js"},
      {name: "./file.js", registeredName: './*.js', path: "./folder/file.js", registeredPath: "./folder/*.js"},
      {name: "./other", registeredName: './*', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./other.js", registeredName: './*.js', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./source.js", registeredPath: "./source.js"},
      {name: "./file.js", registeredName: './file.js', path: "./file.js", registeredPath: "./file.js"},
      {name: "./other.js", registeredName: './*.js', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./source.js", registeredPath: "./source.js"},
      {name: "./file.js", registeredName: './*e.js', path: "./internal/file.js", registeredPath: "./internal/*e.js"},
      {name: "./other.js", registeredName: './*.js', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./source.js", registeredPath: "./source.js"},
      {name: "./file.js", registeredName: './*e.js', path: "./internal/file.js", registeredPath: "./internal/*e.js"},
      {name: "./other.js", registeredName: './*.js', path: "./folder/other.js", registeredPath: "./folder/*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
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
      {name: ".", registeredName: '.', path: "./source.js", registeredPath: "./source.js"},
      {name: "./file.js", registeredName: './*.js', path: "./file.js", registeredPath: "./*.js"},
      {name: "./folder/file.js", registeredName: './*.js', path: "./folder/file.js", registeredPath: "./*.js"},
      {name: "./folder/other.js", registeredName: './*.js', path: "./folder/other.js", registeredPath: "./*.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
      {name: "./source.js", registeredName: './*.js', path: "./source.js", registeredPath: "./*.js"},
    ],
  );
});

test.run();
