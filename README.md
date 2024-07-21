# `@bgotink/list-exports`

This package exposes functions that can be used to list a package's exports and imports.

## `listExports`

The `listExports` function expects one or two parameters:

```ts
export function listExports(
	location: string | URL,
	input?: ImportExportInput
): Promise<Array<ImportExport>>;
```

- `location` is the path or full file URL to the `package.json` file
- `input` can be provided, with multiple options:
  - `packageJson` (`unknown`), the `package.json` object. If a value is passed, it won't be read from `location`.
  - `environment` (`node` | `browser` | null, default: `node`) Environment condition to use in resolving
  - `type` (`import` | `require` | `default` | null, default: `import` when the package is imported and `require` when the package is required) Module type condition to load. The `default` condition is added unless the value `null` is passed.
  - `extraCondition` (`string[]`, default: `[]`) Extra conditions to allow

The returned `ImportExport` objects have four properties:

- `name` is the export path as used to import the export.
  If the name is `'./deep/export'` and the package is named `pkg`, the export can be imported as `pkg/deep/export`.
	The name of the main export is `'.'`, not `''`.
- `path` is the path to the exported file, relative to the `location`.
- `registeredName` is the export name as configured in the `package.json` file.
	If the export contains `*`, this property will still contain the `*`.
	That means that if the `*` export matches multiple files, more than one `ImportExport` will have the same `registeredName`.
- `registeredPath` is the export path as configured in the `package.json` file.
	If the export contains `*`, this property will still contain the `*`.
	That means that if the `*` export matches multiple files, more than one `ImportExport` will have the same `registeredPath`.

## `listImports`

The `listImports` function is identical to `listExports`, except it lists the package's `imports` rather than `exports`.

```ts
export function listImports(
	location: string | URL,
	input?: ImportExportInput
): Promise<Array<ImportExport>>;
```

## License & Notice

This package is licensed under the MIT license, which can be found in `LICENSE.md`.
Dependencies are bundled while publishing, check `NOTICE.md` in the published package for their licenses.
