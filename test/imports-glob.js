import {test} from "uvu";
import * as assert from "uvu/assert";

import {listImports} from "../index.js";

const fixture = new URL("./fixture/package.json", import.meta.url);

function sortByName(arr) {
	return arr.sort((a, b) => a.name.localeCompare(b.name));
}

test("single", async () => {
	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#file": "./file.js",
						"#*.js": "./folder/*.js",
						"#pkg": "./package.json",
					},
				},
			})
		),
		[
			{
				name: "#file",
				registeredName: "#file",
				path: "./file.js",
				registeredPath: "./file.js",
			},
			{
				name: "#file.js",
				registeredName: "#*.js",
				path: "./folder/file.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#other.js",
				registeredName: "#*.js",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#pkg",
				registeredName: "#pkg",
				path: "./package.json",
				registeredPath: "./package.json",
			},
		]
	);

	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#*": "./folder/*.js",
						"#pkg": "./package.json",
					},
				},
			})
		),
		[
			{
				name: "#file",
				registeredName: "#*",
				path: "./folder/file.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#other",
				registeredName: "#*",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#pkg",
				registeredName: "#pkg",
				path: "./package.json",
				registeredPath: "./package.json",
			},
		]
	);
});

test("slash fallback", async () => {
	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#/": "./folder/",
					},
				},
			})
		),
		[
			{
				name: "#/file.js",
				registeredName: "#/",
				path: "./folder/file.js",
				registeredPath: "./folder/*",
			},
			{
				name: "#/other.js",
				registeredName: "#/",
				path: "./folder/other.js",
				registeredPath: "./folder/*",
			},
		]
	);
});

test("multiple", async () => {
	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#*.js": "./folder/*.js",
						"#*": "./folder/*.js",
					},
				},
			})
		),
		[
			{
				name: "#file",
				registeredName: "#*",
				path: "./folder/file.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#file.js",
				registeredName: "#*.js",
				path: "./folder/file.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#other",
				registeredName: "#*",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
			{
				name: "#other.js",
				registeredName: "#*.js",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
		]
	);
});

test("overrides", async () => {
	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#file.js": "./file.js",
						"#*.js": "./folder/*.js",
					},
				},
			})
		),
		[
			{
				name: "#file.js",
				registeredName: "#file.js",
				path: "./file.js",
				registeredPath: "./file.js",
			},
			{
				name: "#other.js",
				registeredName: "#*.js",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
		]
	);

	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#*e.js": "./internal/*e.js",
						"#*.js": "./folder/*.js",
					},
				},
			})
		),
		[
			{
				name: "#file.js",
				registeredName: "#*e.js",
				path: "./internal/file.js",
				registeredPath: "./internal/*e.js",
			},
			{
				name: "#other.js",
				registeredName: "#*.js",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
		]
	);

	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#*.js": "./folder/*.js",
						"#*e.js": "./internal/*e.js",
					},
				},
			})
		),
		[
			{
				name: "#file.js",
				registeredName: "#*e.js",
				path: "./internal/file.js",
				registeredPath: "./internal/*e.js",
			},
			{
				name: "#other.js",
				registeredName: "#*.js",
				path: "./folder/other.js",
				registeredPath: "./folder/*.js",
			},
		]
	);
});

test("deep", async () => {
	assert.equal(
		sortByName(
			await listImports(fixture, {
				packageJson: {
					imports: {
						"#*.js": "./*.js",
						"#internal/*": null,
					},
				},
			})
		),
		[
			{
				name: "#file.js",
				registeredName: "#*.js",
				path: "./file.js",
				registeredPath: "./*.js",
			},
			{
				name: "#folder/file.js",
				registeredName: "#*.js",
				path: "./folder/file.js",
				registeredPath: "./*.js",
			},
			{
				name: "#folder/other.js",
				registeredName: "#*.js",
				path: "./folder/other.js",
				registeredPath: "./*.js",
			},
			{
				name: "#source.js",
				registeredName: "#*.js",
				path: "./source.js",
				registeredPath: "./*.js",
			},
		]
	);
});

test.run();
