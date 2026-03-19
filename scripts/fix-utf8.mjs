#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

const root = process.cwd();
const includeExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.sql', '.css', '.html']);
const skipDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'out']);

const utf8Fatal = new TextDecoder('utf-8', { fatal: true });
const utf8 = new TextDecoder('utf-8');
const latin1 = new TextDecoder('latin1');

let scanned = 0;
let invalid = 0;
let fixed = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!includeExt.has(ext)) continue;

    scanned += 1;
    const buf = fs.readFileSync(fullPath);

    try {
      utf8Fatal.decode(buf);
      continue;
    } catch {
      invalid += 1;
      if (checkOnly) continue;

      // Best-effort salvage: reinterpret bytes as latin1/cp1252-compatible text, then persist as UTF-8.
      const salvaged = latin1.decode(buf);
      fs.writeFileSync(fullPath, salvaged, { encoding: 'utf8' });

      // Validate rewrite.
      const rewritten = fs.readFileSync(fullPath);
      utf8.decode(rewritten);
      fixed += 1;
    }
  }
}

walk(root);

if (checkOnly) {
  if (invalid > 0) {
    console.error(`UTF-8 check failed: ${invalid} invalid file(s) out of ${scanned} scanned.`);
    process.exit(1);
  }
  console.log(`UTF-8 check passed: ${scanned} file(s) scanned.`);
  process.exit(0);
}

console.log(`Scanned: ${scanned}`);
console.log(`Invalid: ${invalid}`);
console.log(`Fixed: ${fixed}`);
if (invalid > fixed) {
  console.error('Some invalid files could not be fixed automatically.');
  process.exit(1);
}
