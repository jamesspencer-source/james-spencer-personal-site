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

The build also creates `dist/vnext/index.html` so the parallel prototype can be opened as a static `/vnext` path.

For a separate prototype GitHub Pages repo, build with:

```bash
npm run build:vnext
```

That command uses the preview base path `/james-spencer-personal-site-vnext/`.

## Checks

```bash
npm run check
```

The check script runs source guardrails, TypeScript, and the production build. It blocks known content regressions such as outdated CTA labels, abstract phrasing that has already been rejected, old headshot asset names, former building-name labels in the public UI, and unintended React Three Fiber usage.

## Content and assets

- Structured site content lives in `src/content.ts`
- UI and section composition live in `src/App.tsx`
- Global styling and motion-ready layout rules live in `src/styles.css`
- Parallel prototype files live in `src/vnext/`
- Public assets live in `public/assets/`

Current public assets:

- Social preview: `public/assets/images/social-preview.svg`
- Resume PDF: `public/assets/resume/james-m-spencer-resume.pdf`
- Favicon: `public/assets/favicon.svg`
- Contact headshot: `public/assets/images/james-m-spencer-studio-headshot.jpg`

Resume source note: the site PDF should match the current public 2026 resume source, currently `JSpencer_Resume_Public_2026.pdf`.

Portrait asset policy: the contact section should use the approved studio headshot and its responsive derivatives only. Do not replace it with a narrow portrait export.

## Deployment

This repository deploys to GitHub Pages through GitHub Actions.

- Production base path: `/james-spencer-personal-site/`
- Prototype preview base path: `/james-spencer-personal-site-vnext/`
- Workflow: `.github/workflows/deploy.yml`

When `main` is pushed, the site is built and deployed through the Pages workflow.
