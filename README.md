# `@bgotink/list-exports`

This package exposes a single `listExports` function that can be used to list a package's exports.

The function expects one or two parameters:

```ts
export function listExports(
  location: string,
  input?: ExportInput,
): Promise<Array<Export>>;
```

- `location` is the path to the pacakgeJson file
- `input` can be provided, with multiple options:
  - `packageJson` (`unknown`), the `package.json` object. If a value is passed, it won't be read from `location`.
  - `environment` (`node` | `browser` | null, default: `node`) Environment condition to use in resolving
  - `type` (`import` | `require` | `default` | null, default: `import` when the package is imported and `require` when the package is required) Module type condition to load. The `default` condition is added unless the value `null` is passed.
  - `extraCondition` (`string[]`, default: `[]`) Extra conditions to allow

## License & Notice

This package is licensed under the MIT license, which can be found in `LICENSE.md`.
Dependencies are bundled while publishing, check `NOTICE.md` in the published package for their licenses.
