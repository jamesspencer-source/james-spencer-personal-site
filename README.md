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
- Adaptive campus hero: `public/assets/images/hero/`

The hero selects one HMS/Longwood campus view once when the page loads, using the
visitor's local time: day from 6:00 a.m. to 3:59 p.m., dusk from 4:00 p.m. to
7:59 p.m., and night from 8:00 p.m. to 5:59 a.m. Visitors can also select
Day, Dusk, or Night using the hero controls. For review, append `?daypart=day`, `?daypart=dusk`, or
`?daypart=night` to the URL.

Hero asset policy: all three dayparts must derive from one shared architectural
composition, use public campus references only as factual guidance, and ship at
960, 1536, and 2560 pixels wide. Do not substitute unrelated skyline or campus
imagery for one daypart.

Resume source note: the linked PDF is preserved. A separately named current public resume was not located during the September 2026 review. Confirm the replacement against James's current approved public resume before updating the link target; do not relabel an older PDF as newly verified.

Portrait asset policy: the contact section should use the approved studio headshot and its responsive derivatives only. Do not replace it with a narrow portrait export.

`npm run check:site` verifies native fragment targets, deferred map loading, hero variants, and checksums for the original portrait and its approved full-frame derivatives. See `docs/2026-09-editorial-rebuild.md` for the review comparison and evidence boundaries.

## Deployment

This repository deploys to GitHub Pages through GitHub Actions.

- Production base path: `/james-spencer-personal-site/`
- Workflow: `.github/workflows/deploy.yml`

When `main` is pushed, the site is built and deployed through the Pages workflow.
