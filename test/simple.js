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
    [{name: ".", registeredExport: '.', path: "./file.js"}],
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
    [{name: ".", registeredExport: '.', path: "./file.js"}],
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
    [{name: ".", registeredExport: '.', path: "./source.js"}],
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
    [{name: ".", registeredExport: '.', path: "./file.js"}],
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
      {name: ".", registeredExport: '.', path: "./file.js"},
      {name: "./file.js", registeredExport: './file.js', path: "./source.js"},
      {name: "./package.json", registeredExport: './package.json', path: "./package.json"},
    ],
  );
});

test.run();
