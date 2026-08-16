# Cabinet Multi-Repo Assembly Architecture

## Concept Note

### Purpose

This note records the decision for how **Cabinet of Curiosities** should include projects that live in independent GitHub repositories while presenting them as part of one coherent website under `cabinetofcuriosities.in`.

It documents:

- the problem;
- the options considered;
- the selected architecture;
- why it was selected;
- how it fits the current Cabinet + MkDocs structure;
- and the implementation workflow.

---

## 1. Current Context

Cabinet is intended to become the main public-facing site for a wider body of work.

A likely structure is:

```text
Cabinet
├── Bookshelf
│   └── separate world / subdomain
├── FFFX
│   └── separate world / subdomain
├── Teaching
│   ├── Working with AI
│   ├── Molding Techniques
│   └── Student Work
├── Travels
└── Galleries
    ├── Rock Collection
    └── Dupatta Collection
```

Some content is simple enough to live directly inside the Cabinet repository as MkDocs pages.

Other projects are substantial enough to remain independent repositories because they have their own:

- source code;
- assets;
- history;
- documentation;
- build systems;
- and development workflows.

The current issue is that these independent projects may be reached through URLs such as:

```text
https://jesalmehta.github.io/working-with-ai/
```

This works technically, but breaks the continuity of the Cabinet domain and public information architecture.

The desired result is instead:

```text
https://cabinetofcuriosities.in/teaching/working-with-ai/
```

while the Working with AI source still remains in its own repository.

---

# 2. Core Principle

The website hierarchy, repository hierarchy, and deployment hierarchy do **not** need to be identical.

### Public information architecture

```text
cabinetofcuriosities.in/teaching/
cabinetofcuriosities.in/teaching/working-with-ai/
cabinetofcuriosities.in/galleries/rocks/
```

### Source repositories

```text
CabinetOfCuriosities
working-with-ai
student-work
rock-collection
dupatta-collection
```

The selected model is therefore:

> **One coherent public website assembled from multiple independent source repositories.**

---

# 3. Options Considered

## Direct GitHub Pages links

Example:

```text
cabinetofcuriosities.in
    ↓
jesalmehta.github.io/working-with-ai/
```

**Advantages:** simplest setup; full repository and deployment independence.

**Disadvantages:** visitors leave the Cabinet domain; public identity and navigation feel fragmented.

**Decision:** retain only as development or fallback URLs, not the preferred public route.

---

## Put all projects inside the Cabinet repo

**Advantages:** one repository, one deployment, simple URL paths.

**Disadvantages:** Cabinet becomes a large monorepo containing unrelated projects, assets, dependencies and histories.

**Decision:** rejected for substantial projects. Small ordinary pages should still remain inside Cabinet.

---

## Give every project a subdomain

Example:

```text
working-with-ai.cabinetofcuriosities.in
rocks.cabinetofcuriosities.in
```

**Advantages:** simple, independent repos and deployments, no `github.io` URLs.

**Disadvantages:** too many first-class subdomains and a weaker semantic hierarchy.

**Decision:** use subdomains only for genuine independent worlds such as:

```text
bookshelf.cabinetofcuriosities.in
fffx.cabinetofcuriosities.in
```

---

## Cloudflare routing

Cloudflare could map a Cabinet path to another hosted project while keeping the Cabinet URL visible.

**Advantages:** clean URLs, fully independent repositories and deployments.

**Disadvantages:** Cloudflare becomes part of the live request path; routing errors can affect the live site immediately; path rewriting and asset handling add complexity.

**Decision:** keep as an exception mechanism for future projects that need independent runtime hosting or cannot be statically assembled.

---

## Git submodules

**Decision:** rejected. Submodules solve source-code composition, while the actual problem is public URL and deployment composition.

---

## GitHub assembly

Each independent project remains in its own repository.

During Cabinet deployment, GitHub Actions:

1. builds Cabinet;
2. checks out the required external repositories;
3. builds their static outputs;
4. copies those outputs into defined Cabinet paths;
5. validates the combined site;
6. deploys one final static artifact.

Example:

```text
SOURCE REPOS

CabinetOfCuriosities
working-with-ai
student-work
rock-collection

        ↓ build + assemble

FINAL DEPLOYMENT

public/
├── index.html
├── teaching/
│   ├── index.html
│   ├── molding-techniques/
│   ├── working-with-ai/
│   └── student-work/
├── travels/
└── galleries/
    └── rocks/
```

The source projects are **not copied into the Cabinet Git repository**. They exist only temporarily in the GitHub Actions runner during assembly.

---

# 4. Selected Architecture

The chosen model is an **assembly-first hybrid architecture**.

### Primary mechanism

Use **GitHub assembly** for normal static Cabinet content, including substantial projects stored in independent repositories.

### Independent worlds

Keep true independent worlds on subdomains:

```text
bookshelf.cabinetofcuriosities.in
fffx.cabinetofcuriosities.in
```

### Exception mechanism

Use Cloudflare routing only when a future project genuinely requires:

- another runtime;
- dynamic functionality;
- a different host;
- or independent deployment without Cabinet rebuilding.

---

# 5. Why This Was Selected

## Repository independence

Substantial projects keep their own repositories, histories, documentation and development workflows.

## Coherent public URLs

Visitors see:

```text
cabinetofcuriosities.in/teaching/working-with-ai/
cabinetofcuriosities.in/teaching/student-work/
cabinetofcuriosities.in/galleries/rocks/
```

rather than unrelated hosting URLs.

## No Cabinet monorepo

The Cabinet source repository remains relatively small. External projects are assembled only during deployment.

## Fits the current site structure

Cabinet already uses:

- a custom landing page;
- data-driven landing-page links;
- MkDocs Markdown pages;
- and `mkdocs.yml` navigation.

Assembly does not replace any of these.

It simply lets existing links target Cabinet-local paths instead of external `github.io` URLs.

## Safer failure model

The intended pipeline is:

```text
build
  ↓
assemble
  ↓
validate
  ↓
deploy
```

If the new build or assembly fails, deployment stops and the previous successful Cabinet version remains live.

This is preferable for normal static projects to a live reverse-proxy layer that participates in every request.

---

# 6. How It Fits the Existing Cabinet + MkDocs Structure

Cabinet continues to contain its custom landing page and normal MkDocs pages:

```text
Cabinet repo
├── custom landing page
├── docs/
│   ├── teaching/
│   ├── travels/
│   └── galleries/
└── mkdocs.yml
```

A normal Cabinet page remains local:

```text
docs/teaching/molding-techniques.md
```

A substantial project remains external but is mounted during deployment:

```text
working-with-ai repo
    ↓
public/teaching/working-with-ai/
```

The MkDocs navigation can therefore mix local Markdown pages with mounted paths:

```yaml
nav:
  - Teaching:
      - Overview: teaching/index.md
      - Molding Techniques: teaching/molding-techniques.md
      - Working with AI: /teaching/working-with-ai/
      - Student Work: /teaching/student-work/
```

Likewise, landing-page data can change from:

```js
{
  title: "Working with AI",
  link: "https://jesalmehta.github.io/working-with-ai/"
}
```

to:

```js
{
  title: "Working with AI",
  link: "/teaching/working-with-ai/"
}
```

The landing page and MkDocs navigation therefore point to the same Cabinet-local route.

---

# 7. Content Ownership Rules

Use a simple rule for deciding where content lives.

### Ordinary Cabinet pages

Remain inside Cabinet and are authored through MkDocs.

### Substantial projects

Remain independent repositories and are assembled into Cabinet at deployment.

### Independent worlds

Remain separate repositories and subdomains.

A route should have only one owner. Avoid having both a Cabinet Markdown page and an external assembled project trying to occupy the same URL.

---

# 8. Assembly Manifest

Once the basic system works, Cabinet should contain a small deployment manifest such as:

```yaml
projects:

  - name: Working with AI
    repository: jesmehta/working-with-ai
    destination: teaching/working-with-ai
    output: dist

  - name: Student Work
    repository: jesmehta/student-work
    destination: teaching/student-work
    output: dist

  - name: Rock Collection
    repository: jesmehta/rock-collection
    destination: galleries/rocks
    output: dist
```

This manifest defines:

- which repository is included;
- where it appears in Cabinet;
- and where its completed static output is located.

It should initially remain separate from Cabinet's public landing-page data.

```text
Landing data
    → what visitors see

Assembly manifest
    → how the deployed site is constructed
```

---

# 9. Independent Project Requirements

Each assembled project should eventually provide:

1. a reproducible static build;
2. a known output directory;
3. an `index.html` at the root of that output;
4. assets that work from its Cabinet mount path.

Projects must also be checked for base-path assumptions.

For example, when moving from:

```text
jesalmehta.github.io/working-with-ai/
```

to:

```text
cabinetofcuriosities.in/teaching/working-with-ai/
```

check:

- image and CSS paths;
- JavaScript imports;
- font paths;
- internal navigation;
- `fetch()` requests;
- canonical URLs;
- service workers;
- framework base-path settings.

Relative paths are preferable where practical.

---

# 10. Deployment Workflow

The eventual Cabinet GitHub Actions workflow should be:

```text
1. Checkout Cabinet
       ↓
2. Build Cabinet into public/
       ↓
3. Read assembly manifest
       ↓
4. For each project:
       ├── checkout repository
       ├── build project
       ├── validate output
       └── copy into public/<destination>/
       ↓
5. Validate complete assembled site
       ↓
6. Upload Pages artifact
       ↓
7. Deploy to GitHub Pages
```

The generated combined site does not need to be committed to the Cabinet repository.

---

# 11. Implementation Phases

## Phase 1 — Proof of concept

Use only:

```text
CabinetOfCuriosities
working-with-ai
```

Goal:

```text
cabinetofcuriosities.in/teaching/working-with-ai/
```

Steps:

1. inspect both repositories;
2. determine their current build/output directories;
3. build Cabinet;
4. build Working with AI;
5. copy its output into the Cabinet deployment tree;
6. deploy;
7. test navigation, assets and paths.

---

## Phase 2 — Generalize

Create the assembly manifest and assembly script.

Add a small variety of projects, such as:

- Working with AI;
- Student Work;
- one gallery.

---

## Phase 3 — Update public links

Change landing-page and MkDocs links from `github.io` targets to Cabinet-local paths.

Bookshelf and FFFX continue linking to their subdomains.

---

## Phase 4 — Automatic rebuild triggers

Initially, rebuild Cabinet:

- when Cabinet changes;
- or manually through GitHub Actions.

Later, independent project repositories can trigger a new Cabinet assembly after they change.

The simplest behaviour is to rebuild the whole site from current sources rather than attempting incremental deployment.

---

## Phase 5 — Validation and resilience

Before deployment, confirm:

- every required repository was fetched;
- every project built successfully;
- expected output folders exist;
- each project contains an `index.html`;
- no two projects claim the same mount path;
- Cabinet output has not been overwritten unexpectedly.

Deployment should be **all-or-nothing**.

If a required project fails, the new Cabinet version should not deploy.

---

# 12. Final Model

```text
GitHub repositories
        │
        ├── Cabinet
        ├── Working with AI
        ├── Student Work
        ├── Rock Collection
        └── other projects
        │
        ▼
GitHub Actions
build + assemble
        │
        ▼
cabinetofcuriosities.in
├── Teaching
│   ├── Working with AI
│   └── Student Work
├── Travels
└── Galleries
    └── Rocks


Independent worlds:

bookshelf.cabinetofcuriosities.in
fffx.cabinetofcuriosities.in
```

---

# 13. Decision Summary

The agreed direction is:

1. Cabinet remains the primary public site and curatorial layer.
2. Ordinary pages remain inside Cabinet and MkDocs.
3. Substantial projects remain independent Git repositories.
4. Their static outputs are assembled into Cabinet at meaningful internal paths.
5. The landing page and `mkdocs.yml` link to those Cabinet-local paths.
6. Bookshelf and FFFX remain independent worlds on subdomains.
7. Cloudflare routing remains available for exceptional future projects.
8. Existing `github.io` deployments may remain as fallback or development URLs.
9. The assembly is validated before deployment so a failed new build does not replace the current live site.

> **Cabinet should behave as one coherent website to the visitor without requiring all of its underlying projects to live in one repository.**
