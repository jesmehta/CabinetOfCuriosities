// allowlist.mjs -- the publication allowlists: which files of an external mount
// (content/external-allowlists/<id>.txt) or of the archive (content/archive-allowlist.txt)
// are published. Owner decision D3/D4 (cloudflare migration/plan.md): only listed files
// are published; anything else the source contains is left out and reported, never a
// failure. Same syntax as FFFX's publish.txt:
//
//   one file path per line, relative to the source folder; '#' starts a comment;
//   files only -- no folders, no wildcards; forward slashes.
//
// A file whose name contains '#' cannot be listed; rename it at the source. ('#' also
// breaks it on the web: a browser treats the rest of the URL as a fragment.)
//
// Policy and path errors are FATAL (AllowlistError): an absent or empty list, an absolute
// path, '..' / '.' / empty parts, a wildcard, a backslash, a path listed twice (also when
// only the letter case differs: Windows and macOS would collide), a listed file that is
// missing, a symlink, a folder or any other non-regular file. A missing listed file is
// fatal because a page that needs it would break.

import { existsSync } from "node:fs";
import { lstat, readFile, readdir } from "node:fs/promises";
import { join, sep } from "node:path";

export class AllowlistError extends Error {}

const toPosix = (p) => p.split(sep).join("/");

// Parse and syntax-check an allowlist's text. Returns the entries in file order.
export function parseAllowlist(text, label) {
  const entries = text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);
  if (!entries.length) throw new AllowlistError(`${label}: lists no files`);
  const seen = new Map();
  for (const entry of entries) {
    const where = `${label}: "${entry}"`;
    if (entry.includes("\\")) throw new AllowlistError(`${where} -- use forward slashes`);
    if (entry.startsWith("/") || /^[A-Za-z]:/.test(entry)) throw new AllowlistError(`${where} -- absolute paths not allowed`);
    if (entry.split("/").some((p) => p === ".." || p === "." || p === "")) throw new AllowlistError(`${where} -- '..', '.', empty path parts and folders (trailing '/') not allowed`);
    if (/[*?[\]]/.test(entry)) throw new AllowlistError(`${where} -- wildcards not allowed; list files one by one`);
    const key = entry.toLowerCase();
    if (seen.has(key)) {
      const first = seen.get(key);
      throw new AllowlistError(first === entry ? `${where} -- listed twice` : `${where} -- differs from "${first}" only in letter case; the two would collide on Windows/macOS`);
    }
    seen.set(key, entry);
  }
  return entries;
}

export async function readAllowlist(file, label) {
  const st = await lstat(file).catch(() => null);
  if (!st) throw new AllowlistError(`${label}: allowlist not found -- every source needs one (an unlisted source is never published whole)`);
  if (!st.isFile()) throw new AllowlistError(`${label}: must be a regular file`);
  return parseAllowlist(await readFile(file, "utf8"), label);
}

// Explain a listed path that is not in the source: exact miss, or a letter-case mismatch
// (Linux, and so Cloudflare's build, is case-sensitive; Windows is not).
export function missingMessage(label, entry, available) {
  const lower = entry.toLowerCase();
  const near = available.find((p) => p.toLowerCase() === lower);
  return near
    ? `${label}: "${entry}" not found -- the source has "${near}" (letter case differs; paths are case-sensitive on the build server)`
    : `${label}: "${entry}" not found in the source -- a page that needs it would break (remove it from the list, or restore the file)`;
}

// Check every entry against a folder on disk: exists, a regular file, no symlink on the way.
// Returns { files: [entries], unlisted: [paths in dir not listed] }.
export async function checkAgainstDir(entries, dir, label) {
  if (!existsSync(dir)) throw new AllowlistError(`${label}: source folder ${dir} not found`);
  const all = await listFiles(dir);
  for (const entry of entries) {
    let current = dir;
    for (const part of entry.split("/")) {
      current = join(current, part);
      const st = await lstat(current).catch(() => null);
      if (!st) throw new AllowlistError(missingMessage(label, entry, all));
      if (st.isSymbolicLink()) throw new AllowlistError(`${label}: "${entry}" -- symlink not allowed (${toPosix(current)})`);
    }
    const st = await lstat(current);
    if (!st.isFile()) throw new AllowlistError(`${label}: "${entry}" -- not a regular file (folders are not allowed; list files one by one)`);
    if (!all.includes(entry)) throw new AllowlistError(missingMessage(label, entry, all)); // case-insensitive file system matched a differently-cased name
  }
  const listed = new Set(entries);
  return { files: entries, unlisted: all.filter((p) => !listed.has(p)) };
}

async function listFiles(dir, prefix = "") {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === ".git") continue; // a local clone's repository data (--external-local), never a source file
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(join(dir, e.name), rel)));
    else out.push(rel);
  }
  return out.sort();
}

// "dir/a.js, dir/b.js, x.png" -> "dir/ (2), x.png": a short summary of unlisted paths for the build log.
export function summarise(paths, max = 8) {
  const groups = new Map();
  for (const p of paths) {
    const i = p.indexOf("/");
    const key = i < 0 ? p : p.slice(0, i + 1);
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  const parts = [...groups].map(([k, n]) => (k.endsWith("/") ? `${k} (${n})` : k));
  return parts.length > max ? `${parts.slice(0, max).join(", ")}, … ${parts.length - max} more` : parts.join(", ");
}
