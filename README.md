# James M. Spencer Personal Site

Premium one-page professional site for GitHub Pages, built with Vite, React, and TypeScript.

## Local development

From the repository root:

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

The production build is emitted to `dist/`.

## Checks

```bash
npm run check
```

The check script runs source guardrails, TypeScript, and the production build. It blocks known content regressions such as outdated CTA labels, abstract phrasing that has already been rejected, old headshot asset names, former building-name labels in the public UI, and unintended React Three Fiber usage.

## Content and assets

- Current public copy lives in `src/App.tsx` and `src/professionalContent.ts`; `src/content.ts` is legacy content and does not drive the homepage.
- UI and section composition live in `src/App.tsx`
- Global styling and motion-ready layout rules live in `src/styles.css`
- Public assets live in `public/assets/`

Current public assets:

- Social preview: `public/assets/images/social-preview.svg`
- Resume PDF: `public/assets/resume/james-m-spencer-resume.pdf`
- Favicon: `public/assets/favicon.svg`
- Hero photograph: `public/assets/images/hms-quad-brett-wharton.jpg`
- Contact headshot: `public/assets/images/james-m-spencer-studio-headshot.jpg`

The opening uses James's selected real HMS Quad photograph by Brett Wharton,
with visible credit and the two-column layout reviewed on October 3, 2026.
Source and license details are in `docs/2026-10-hms-quad-hero.md`.

The rejected generated campus aerial and all nine day/dusk/night derivatives
remain excluded. Do not restore these files, reuse them under other names, or
add a generated skyline as a substitute. The asset checks block their
fingerprints as well as their previous paths.

Resume source note: on October 3, 2026, James asked to keep using the existing public resume while he prepares a new version. The linked PDF matches his local Public 2026 resume byte for byte and is preserved. Replace it when he supplies the new approved public version; do not relabel the existing PDF as revised.

Portrait asset policy: the contact section should use the approved studio headshot and its responsive derivatives only. Do not replace it with a narrow portrait export.

`npm run check:site` verifies native fragment targets, deferred map loading, rejected image fingerprints, and checksums for the original portrait and its approved full-frame derivatives. See `docs/2026-09-editorial-rebuild.md` for the review comparison and evidence boundaries.

## Deployment

This repository deploys to GitHub Pages through GitHub Actions.

- Production base path: `/james-spencer-personal-site/`
- Workflow: `.github/workflows/deploy.yml`

When `main` is pushed, the site is built and deployed through the Pages workflow.
