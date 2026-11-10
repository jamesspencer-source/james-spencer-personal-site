# CLAUDE.md

Claude Code loads this file automatically. `README.md` has the commands; this file adds the working notes.

## What this is

- James M. Spencer's one-page professional site: Vite, React and TypeScript, published by GitHub Actions (`.github/workflows/deploy.yml`) to https://jamesspencer-source.github.io/james-spencer-personal-site/ on every push to `main`. Pull requests run the same checks without publishing.
- Two local folders share one repository: `james-spencer-personal-site-live-main` is on `main` and matches the live site; `james-spencer-personal-site` is on `vnext/igloo-inspired-prototype`, a design prototype from July 2026. Work on `main` in the live-main folder unless James asks about the prototype.

## How to make a change

1. Edit the source under `src/`. Node 22 or later; run `npm ci` once per folder.
2. Run `npm run check`: content check, site check, type check and build. Fix problems in the source.
3. Commit and push to `main`; the workflow builds and publishes within a few minutes. Confirm the live page afterwards.

Publishing changes the public site, so tell James what will change before pushing.

## Dependabot

Dependabot is GitHub's automatic dependency-update bot. It opens pull requests that bump library versions. Merge the ones whose checks pass; close or leave the ones whose checks fail until someone does a real upgrade. In November 2026 the major jumps (vite 8, typescript 7, plugin-react 6) failed checks; the grouped minor updates and the actions bump passed.

## Housekeeping

- The folders moved from iCloud-synced `~/Documents` to `~/Developer/GitHub` on 2026-11-09. Numbered copies such as `index 2` inside `.git` were iCloud junk from that time; never commit such files.
