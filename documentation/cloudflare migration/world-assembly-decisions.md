# World assembly and deferred tools — discussion record

Recorded **2026-10-21 03:10:10 IST** by Codex. Preserves the owner/Codex discussion following the FFFX and Cabinet audits. This is architectural intent and implementation handoff, not evidence that build changes are already implemented. Exact earlier message times were not retained.

## 1. Can FFFX hold back Dance of Planets and Island Generator?

**Owner question:** can both tools wait until their code is separated, as a separate workout, or must separation happen within/before FFFX migration?

**Codex answer:** algorithm separation can be a separate later project. The hosting migration needs a publication boundary now: exclude `/dance-of-planets/` and `/island-generator/`, including their models, UI/sketch JavaScript and other tool assets, from the public artifact. Keep private/local source. Placeholder articles may remain public without exposing a runnable tool. Test tool and source URLs return real 404s.

The current FFFX workflow copies both directories despite their being unlinked; a navigation gate alone is insufficient. This proposed exclusion should be explicit in Claude's implementation plan and owner-reviewed before the production change. Algorithm conversion must not delay the rest of the site unnecessarily or be silently bundled into hosting work. Prior public copies cannot be withdrawn by changing the repository or artifact.

**Handoff:** publication exclusion belongs in the FFFX migration; algorithm/API design, local-core/batch preservation, performance tests and later tool publication belong in separately scoped work. Separate repositories are not required. See the [transition register](transition-register.md) and [protected-tools guide](future-protected-tools-architecture.md).

## 2. What happens to Cabinet's externally sourced sub-pages?

**Owner question:** Cabinet deploys external repositories as internal sub-pages; how are these affected?

**Codex answer:** keep their Cabinet paths. They are build-time copies within Cabinet's final artifact, so one Cabinet deployment can serve them all; they do not need a Worker per project or page.

Current audited Cabinet mounts:

| Source | Cabinet route |
| --- | --- |
| Working with AI | `/teaching/working-with-ai/` |
| Prompt Generator | `/teaching/prompt-generator/` |
| Oblique Strategies | `/teaching/oblique-strategies/` |
| SSD Student Work | Three creative-coding teaching paths |
| SwatchFields | `/swatch-fields/` |
| TraceryBots | `/tracery-bots/` |

Preserve assembly, explicitly select public runtime files, record/pin source revisions, and test mounted paths/assets/interactions. Public sources can still be fetched anonymously. Private sources require explicit cross-repository build access; authorizing the parent repository alone does not establish credentials for arbitrary clone commands. Keep credentials out of published files and logs.

An external project's independent GitHub Pages deployment is a separate publication path. Migrating its mounted Cabinet copy does not migrate or retire its standalone site. Decide individually whether that standalone site remains, moves or redirects; preserve intended links and avoid claiming private source while another host still serves protected code.

## 3. This capability belongs to every world

**Owner clarification:** the same principle applies to Bookshelf and FFFX; each may acquire external repositories that should appear as internal sub-pages.

**Codex clarification of the inspected baseline:**

| World | Current build sources | Future requirement |
| --- | --- | --- |
| Bookshelf | MkDocs pages plus internal `projects/asimov`, `projects/christie`, `projects/scifi` | Allow selected external mounts when needed |
| FFFX | MkDocs pages (including Vera Molnar, Circle Packing and placeholders) plus internal tool directories; external resources currently linked, not cloned by its workflow | Allow selected external mounts; keep protected tools out until ready |
| Cabinet | MkDocs/native assets plus eight mounts from six external repositories and archived landing pages | Preserve/filter/reproduce existing assembly |

The owner was unsure whether FFFX had MkDocs pages; source inspection confirms it does. External links are distinct from external repositories assembled at build time.

Shared architectural principle:

```text
MkDocs pages + approved internal projects + approved external mounts
                              |
                 assemble / filter / validate
                              |
              one host-neutral public artifact
                              |
                    one deployment per world
```

**All three worlds should be capable of this pattern.** Cabinet must not become the only world allowed to mount projects. This does not require introducing external clones into Bookshelf/FFFX before any are needed, nor immediately replacing every build with a shared framework. Reuse validated conventions/helpers where useful while retaining each site's existing authoring and build behaviour.

## 4. Requirements for each mount

- Explicit source repository and resolved revision; local internal projects use the parent source revision.
- Explicit destination within the world, with collision and path-escape checks.
- Public-file list or audited publication policy, independent of navigation/live/WIP state.
- Authenticated source access where needed, with actual tested credential scope.
- Necessary runtime assets/data/fonts/licence notices included; docs, editor/tooling, secrets and protected core code excluded.
- Required entry points, local routes, nested assets and functional interactions validated on the assembled tree.
- Release record includes parent SHA, external SHAs, dependency/build versions and artifact hashes, with a saved-artifact recovery path.
- Clear rebuild policy when an external source changes; a remote commit does not automatically trigger a parent-site build unless configured to do so.

Keep builds and artifacts locally reproducible and usable without AI. Adding future mounts should require a small deliberate configuration change, not a website or CMS redesign. Hosting remains separate from protecting the source of algorithms/images/data delivered through that host.

## Scope and next action

Claude should reflect these requirements in the FFFX/Cabinet implementation plans and future Bookshelf external-project work. Codex reviews actual diffs and publication evidence. Owner approvals remain necessary for production pushes, credentials/access, visibility, DNS and cutover. No application, build configuration or deployment was changed by recording this discussion.
