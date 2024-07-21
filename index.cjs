// @ts-check

/**
 * @param {string} location
 * @param {import('./index.js').ImportExportInput} [input]
 * @returns {Promise<Array<import('./index.js').ImportExport>>}
 */
exports.listExports = async function (
	location,
	{type = "require", ...rest} = {}
) {
	return (await import("./index.js")).listExports(location, {
		type,
		...rest,
	});
};

/**
 * @param {string} location
 * @param {import('./index.js').ImportExportInput} [input]
 * @returns {Promise<Array<import('./index.js').ImportExport>>}
 */
exports.listImports = async function (
	location,
	{type = "require", ...rest} = {}
) {
	return (await import("./index.js")).listImports(location, {
		type,
		...rest,
	});
};
