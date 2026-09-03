// Now page -- the tiny Markdown-subset renderer, shared between
// tools/build-now-content.js (dynamically imported to pre-render entry text
// into docs/compass/now.md at build time) and tools/now-editor's browser UI (its
// live preview), so the two can never drift apart. Pure functions, no DOM
// dependency beyond the strings/HTML they produce -- see
// documentation/NOW-PAGE.md's "Markdown subset".

const SAFE_URL_RE = /^(https?:|mailto:)/i;

export function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Deliberately tiny: bold, italic, links only -- see now.tsv's "value"
// field rules in documentation/NOW-PAGE.md. Escapes HTML first so the Markdown syntax
// below is the only source of tags in the output.
export function renderInline(value) {
  let html = escapeHtml(value);

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const trimmedUrl = url.trim();
    if (!SAFE_URL_RE.test(trimmedUrl)) return text;
    return `<a href="${trimmedUrl}" target="_blank" rel="noopener">${text}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}

// A now.tsv value can be multiple paragraphs (blank-line separated, same
// convention as a hand-typed reaction in Excel) -- split before renderInline
// so each paragraph becomes its own <p> instead of running the whole value
// together as one block with the paragraph breaks silently collapsed (plain
// HTML text flow ignores bare newlines). A lone remaining single newline
// within a paragraph collapses to a space.
export function splitParagraphs(value) {
  return value
    .split(/\n\s*\n+/)
    .map(paragraph => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}
