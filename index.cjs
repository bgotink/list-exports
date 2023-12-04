// @ts-check

/**
 * @param {string} location
 * @param {import('./index.js').ExportInput} [input]
 * @returns {Promise<Array<import('./index.js').Export>>}
 */
exports.listExports = async function (
  location,
  {type = "require", ...rest} = {},
) {
  return (await import("./index.js")).listExports(location, {
    type,
    ...rest,
  });
};
