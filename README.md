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
- Contact headshot: `public/assets/images/james-m-spencer-studio-headshot.jpg`

The rejected generated campus aerial and all nine day/dusk/night derivatives
have been removed from the published assets and active page. The opening is
text-led until James approves a replacement. Do not restore these files, reuse
them under other names, or add a new generated skyline as a substitute. The
asset checks block their fingerprints as well as their previous paths.

Resume source note: the linked PDF is preserved. A separately named current public resume was not located during the September 2026 review. Confirm the replacement against James's current approved public resume before updating the link target; do not relabel an older PDF as newly verified.

Portrait asset policy: the contact section should use the approved studio headshot and its responsive derivatives only. Do not replace it with a narrow portrait export.

`npm run check:site` verifies native fragment targets, deferred map loading, hero variants, and checksums for the original portrait and its approved full-frame derivatives. See `docs/2026-09-editorial-rebuild.md` for the review comparison and evidence boundaries.

## Deployment

This repository deploys to GitHub Pages through GitHub Actions.

- Production base path: `/james-spencer-personal-site/`
- Workflow: `.github/workflows/deploy.yml`

When `main` is pushed, the site is built and deployed through the Pages workflow.
