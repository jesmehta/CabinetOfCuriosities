const fs = require("fs");
const path = require("path");
const { readEntries } = require("./now-tsv");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "content", "now.tsv");
const outputPath = path.join(root, "docs", "assets", "js", "now-generated-content.js");

const raw = fs.readFileSync(sourcePath, "utf8");
const nowEntries = readEntries(raw, path.relative(root, sourcePath));

const output = `// AUTO-GENERATED FILE.
// Do not edit.
// Edit content/now.tsv, then run:
//
// node tools/build-now-content.js

export const nowEntries = ${JSON.stringify(nowEntries, null, 2)};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} (${nowEntries.length} entries)`);
