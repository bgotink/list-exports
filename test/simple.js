import {fileURLToPath} from "node:url";
import {test} from "uvu";
import * as assert from "uvu/assert";

import {listExports} from "../index.js";

const fixture = fileURLToPath(
  new URL("./fixture/package.json", import.meta.url),
);

test("null", async () => {
  assert.equal(
    await listExports(fixture, {
			packageJson: {
				exports: null,
			}
    }),
    [],
  );
});

test("string", async () => {
  assert.equal(
    await listExports(fixture, {
			packageJson: {
				exports: "./file.js",
			}
    }),
    [{name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"}],
  );
});

test("condition object", async () => {
  assert.equal(
    await listExports(fixture, {
			packageJson: {
				exports: {
					default: "./file.js",
				},
			}
    }),
    [{name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"}],
  );

  assert.equal(
    await listExports(fixture, {
			packageJson: {
				exports: {
					node: "./source.js",
					default: "./file.js",
				},
			}
    }),
    [{name: ".", registeredName: '.', path: "./source.js", registeredPath: "./source.js"}],
  );

  assert.equal(
    await listExports(fixture, {
			packageJson: {
				exports: {
					default: "./file.js",
					node: "./source.js",
				},
			}
    }),
    [{name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"}],
  );
});

test("path object", async () => {
  assert.equal(
    await listExports(fixture, {
			packageJson: {
				exports: {
					".": "./file.js",
					"./file.js": "./source.js",
					"./package.json": "./package.json",
				},
			}
    }),
    [
      {name: ".", registeredName: '.', path: "./file.js", registeredPath: "./file.js"},
      {name: "./file.js", registeredName: './file.js', path: "./source.js", registeredPath: "./source.js"},
      {name: "./package.json", registeredName: './package.json', path: "./package.json", registeredPath: "./package.json"},
    ],
  );
});

test.run();
