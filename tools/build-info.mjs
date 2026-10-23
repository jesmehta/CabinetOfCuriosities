// build-info.mjs -- the release boundary for development builds (Cloudflare migration plan C7).
// tools/build-site.mjs writes build-info.json NEXT TO public/ (never inside it). save-artifact and
// verify-artifact accept only a pinned build: no --external-local mount, every external mount from a
// full commit SHA.

export function checkBuildInfo(info, where) {
  if (!info || typeof info !== "object") throw new Error(`${where}: missing or unreadable build information`);
  if (info.development !== false) {
    throw new Error(`${where}: this is a DEVELOPMENT build (--external-local: an external project came from a local folder, not its pinned revision). It must never be released or deployed. Run \`npm run build\` without --external-local.`);
  }
  if (!Array.isArray(info.externals) || info.externals.some((m) => m.source !== "pinned" || !/^[0-9a-f]{40}$/.test(m.revision || ""))) {
    throw new Error(`${where}: every external mount must come from a pinned revision`);
  }
}
