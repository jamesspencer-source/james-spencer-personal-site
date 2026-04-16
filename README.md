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

## Content and assets

- Structured site content lives in `src/content.ts`
- UI and section composition live in `src/App.tsx`
- Global styling and motion-ready layout rules live in `src/styles.css`
- Public assets live in `public/assets/`

Current public assets:

- Social preview: `public/assets/images/social-preview.svg`
- Resume PDF: `public/assets/resume/james-m-spencer-resume.pdf`
- Favicon: `public/assets/favicon.svg`
- Portrait: `public/assets/images/james-m-spencer-background-5900.jpg`

## Deployment

This repository deploys to GitHub Pages through GitHub Actions.

- Production base path: `/james-spencer-personal-site/`
- Workflow: `.github/workflows/deploy.yml`

When `main` is pushed, the site is built and deployed through the Pages workflow.
