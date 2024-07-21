import {fileURLToPath} from "node:url";
import {test} from "uvu";
import * as assert from "uvu/assert";

import {listExports} from "../index.js";
import {relative} from "node:path";
import {cwd} from "node:process";

const fixture = new URL("./fixture/package.json", import.meta.url);

test("URL location", async () => {
	assert.equal(
		await listExports(fixture, {
			packageJson: {
				exports: null,
			},
		}),
		[]
	);
});

test("absolute location", async () => {
	assert.equal(
		await listExports(fileURLToPath(fixture), {
			packageJson: {
				exports: null,
			},
		}),
		[]
	);
});

test("relative location", async () => {
	assert.equal(
		await listExports(relative(cwd(), fileURLToPath(fixture)), {
			packageJson: {
				exports: null,
			},
		}),
		[]
	);
});

test.run();
