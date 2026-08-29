// Pure logic: weighted rectangular region partition ("squarified treemap").
// No DOM access -- mirrors fffx-subdivision.js's split between pure layout
// logic and DOM rendering (see fffx's LANDING-PAGE-NOTES.md). This file
// could run in Node (build-time) or a browser unchanged.
//
// Why squarify() and not fffx's linear peel-chain (buildRectTree in
// fffx-subdivision.js): fffx peels one region off the remainder per
// section, in section order, and only reduces (doesn't guarantee) aspect
// distortion via splitRectSquarified() -- acceptable there because fffx
// has no explicit aspect-ratio contract on a region. Cabinet v3 originally
// had a hard ask ("regions remain rectangular between 9:16 and 16:9"),
// since relaxed (see the v3.1 note further down) -- but still uses the
// actual Bruls/Huizing/van Wijk squarified-treemap algorithm (items laid
// out in rows/columns, each row sized to keep its members close to
// square) rather than fffx's chain, since it's the better-behaved
// starting point even without a hard band enforced on top.

// The "worst" aspect-ratio score for a candidate row: the squarify paper's
// formula, computed against `length` (the side of the remaining rect the
// row will be laid out along). Lower is better (1 = every rect in the row
// is a perfect square).
function worst(row, length) {
  const sum = row.reduce((s, r) => s + r.area, 0);
  if (sum === 0) return Infinity;
  const rowMax = Math.max(...row.map(r => r.area));
  const rowMin = Math.min(...row.map(r => r.area));
  return Math.max(
    (length * length * rowMax) / (sum * sum),
    (sum * sum) / (length * length * rowMin)
  );
}

// Lays one completed row into `rect`, along whichever side is currently
// shorter (a "row" is a horizontal strip of side-by-side rects if the
// remaining container is wider than tall, or a vertical stack of
// side-by-side rects if it's taller than wide) -- standard squarify
// convention. Returns the rect still remaining after this row is removed.
function layoutRow(row, rect, result) {
  const rowArea = row.reduce((s, r) => s + r.area, 0);

  if (rect.width <= rect.height) {
    const rowHeight = rect.width > 0 ? rowArea / rect.width : 0;
    let x = rect.x;
    row.forEach(item => {
      const w = rowHeight > 0 ? item.area / rowHeight : 0;
      result.push({ id: item.id, x, y: rect.y, width: w, height: rowHeight });
      x += w;
    });
    return { x: rect.x, y: rect.y + rowHeight, width: rect.width, height: rect.height - rowHeight };
  }

  const rowWidth = rect.height > 0 ? rowArea / rect.height : 0;
  let y = rect.y;
  row.forEach(item => {
    const h = rowWidth > 0 ? item.area / rowWidth : 0;
    result.push({ id: item.id, x: rect.x, y, width: rowWidth, height: h });
    y += h;
  });
  return { x: rect.x + rowWidth, y: rect.y, width: rect.width - rowWidth, height: rect.height };
}

// items: [{ id, weight }], laid out in the EXACT order given -- the
// caller is responsible for that order, and it's what determines each
// region's position in the reading sequence (region *area* comes from
// weight; region *placement order* comes from whatever sequence the
// caller passed in, exactly the same weight-drives-size /
// order-drives-position split used one level down for entries within
// an archipelago -- see cabinet-v3-circlepack.js).
//
// The classic squarify algorithm normally pre-sorts items descending by
// size, since row-building quality (how close to square each result
// ends up) is measurably better with largest-first input. Deliberately
// NOT done here: sorting by weight would silently reorder sections by
// weight instead of their authored `order` (this file's own v3.0
// draft did exactly that, unnoticed until a screenshot showed regions
// running highest-to-lowest weight left to right regardless of section
// `order`). Acceptable trade because squareness is no longer a hard
// contract this pass (see the relaxed-aspect note above) -- if the
// aspect band comes back later, restoring the sort here is a one-line
// change, but it would need to go through squarifyWithAspectSearch()
// (or its restored equivalent) to actually keep the band promise, not
// just this function alone.
//
// rect: { x, y, width, height }, the container to fill entirely.
// Returns [{ id, x, y, width, height }], one per item, tiling `rect`
// exactly (zero gap, zero overlap -- unlike the circle-packing layer,
// this is a true partition).
export function squarify(items, rect) {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0) || 1;
  const totalArea = rect.width * rect.height;
  const scaled = items.map(i => ({ id: i.id, area: (i.weight / totalWeight) * totalArea }));

  const result = [];
  let remaining = { ...rect };
  let row = [];
  let queue = scaled;

  while (queue.length) {
    const length = Math.min(remaining.width, remaining.height);
    const candidateRow = [...row, queue[0]];

    if (row.length === 0 || worst(row, length) >= worst(candidateRow, length)) {
      row = candidateRow;
      queue = queue.slice(1);
    } else {
      remaining = layoutRow(row, remaining, result);
      row = [];
    }
  }
  if (row.length) {
    layoutRow(row, remaining, result);
  }

  return result;
}

// v3.1: the 9:16-16:9 aspect-band contract (and the height-search that
// tried to enforce it, squarifyWithAspectSearch()) was dropped per
// explicit direction ("I am relaxing the squarish constraint, let's see
// how that works or we can get it back"). squarify() on its own still
// keeps rows reasonably close to square as a side effect of the
// algorithm (that's what "worst aspect ratio" scoring is for), it just
// isn't validated against a hard band anymore, and canvas height is no
// longer chosen to satisfy one -- see cabinet-v3-layout.js's
// canvasHeightFor() for how height is picked instead (from total weight
// and a target density, not from an aspect search). If the band comes
// back later, squarifyWithAspectSearch() from the v3.0 pass is in git
// history and can be restored wholesale; the row/column-packing core
// (squarify() above) didn't change and doesn't need to.
