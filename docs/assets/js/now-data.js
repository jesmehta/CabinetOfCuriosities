// Now page -- hand-edited display config, kept separate from now.tsv's
// content so that section titles, fade behaviour, and visible counts can
// change without touching data (see documentation/NOW-PAGE.md's "Section Configuration").

export const nowPageConfig = {
  title: "Now",
  tagline: "A periodically updated snapshot of what I'm reading, watching, making, teaching and thinking about.",
};

// mode "stream": several short-lived entries, groupSize 2 -> pairs get
//   current/recent/old emphasis (100/100/50/50/25/25).
// mode "snapshot": a few longer-lived entries, groupSize 1 -> each entry
//   gets its own emphasis step (100/50/25).
// imageLayout "side": a thumbnail beside the text (book covers, link
//   screenshots -- anything the text can wrap around).
// imageLayout "full": image spans the full entry width, above the text
//   (a photo that's the point, not an illustration of the text next to it).
export const sectionConfig = {
  reading: { title: "Recent reads", mode: "stream", visible: 6, groupSize: 2, imageLayout: "side" },
  watching: { title: "Whatcha watchin' ?", mode: "stream", visible: 6, groupSize: 2, imageLayout: "side" },
  music: { title: "Current earworms I'm listening to", mode: "stream", visible: 6, groupSize: 2, imageLayout: "side" },
  projects: { title: "Active projects", mode: "snapshot", visible: 3, groupSize: 1, imageLayout: "side" },
  teaching: { title: "Teaching this semester", mode: "snapshot", visible: 3, groupSize: 1, imageLayout: "side" },
  travel: { title: "Wanderings", mode: "stream", visible: 6, groupSize: 2, imageLayout: "full" },
  curiosities: { title: "Current curiosities", mode: "snapshot", visible: 3, groupSize: 1, imageLayout: "side" },
  making: { title: "Making & doing", mode: "stream", visible: 6, groupSize: 2, imageLayout: "full" },
  found: { title: "Stumbleupon'd", mode: "stream", visible: 6, groupSize: 2, imageLayout: "side" },
  andThenSome: { title: "And then some", mode: "stream", visible: 6, groupSize: 2, imageLayout: "side" },
};

// Order sections appear on the page, independent of section-key alphabetical
// order or now.tsv row order.
export const sectionOrder = [
  "reading",
  "watching",
  "music",
  "projects",
  "teaching",
  "travel",
  "curiosities",
  "making",
  "found",
  "andThenSome",
];
