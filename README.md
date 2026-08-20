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

- Structured site content lives in `src/content.ts`
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
7:59 p.m., and night from 8:00 p.m. to 5:59 a.m. The selection stays fixed for
that visit. For review, append `?daypart=day`, `?daypart=dusk`, or
`?daypart=night` to the URL.

Resume source note: the site PDF should match the current public 2026 resume source, currently `JSpencer_Resume_Public_2026.pdf`.

Portrait asset policy: the contact section should use the approved studio headshot and its responsive derivatives only. Do not replace it with a narrow portrait export.

## Deployment

This repository deploys to GitHub Pages through GitHub Actions.

- Production base path: `/james-spencer-personal-site/`
- Workflow: `.github/workflows/deploy.yml`

When `main` is pushed, the site is built and deployed through the Pages workflow.
