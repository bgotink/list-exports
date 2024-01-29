#!/usr/bin/env bash

cd "$(dirname "$0")"
cd ..

rm -rf dist
mkdir dist

yarn esbuild --minify index.js --outfile=dist/index.js --bundle --platform=node --target=node18 --format=esm --metafile=node_modules/.cache/meta.json

cp index.d.ts index.d.cts index.cjs dist/

cp *.md dist/

jq "del(.scripts) | del(.devDependencies) | del(.private) | del(.packageManager)" <package.json > dist/package.json

cat <<EOF >dist/NOTICE.md
# Copyright notice

This package bundles its dependencies before publication. The names and license of these packages are listed below:
EOF

for pkg in $(jq -r '[.inputs[] | .imports?.[0].original | select(. != null) | select(startswith(".") | not)] | unique[]' node_modules/.cache/meta.json)
do
	echo "Bundled dependency $pkg"
	version=$(jq -r .version node_modules/$pkg/package.json)
cat <<EOF >>dist/NOTICE.md

## [\`${pkg}\` version ${version}](https://www.npmjs.com/package/${pkg}/v/${version})

\`\`\`
$(cat node_modules/$pkg/LICENSE*)
\`\`\`
EOF
done
