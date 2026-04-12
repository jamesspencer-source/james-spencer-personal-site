# James M. Spencer Personal Site

One-page static site for GitHub Pages.

## Local preview

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Edit content

Most copy lives in [`content.js`](./content.js). Update that file when you want to change:

- hero copy and links
- current scope facts
- experience entries
- selected work items
- background and education
- contact links
- footer disclaimer

The page structure is in [`index.html`](./index.html) and styling is in [`styles.css`](./styles.css).

## Assets

- Portrait: `assets/images/james-m-spencer-portrait.jpg`
- Resume PDF: `assets/resume/james-m-spencer-resume.pdf`
- Favicon: `assets/favicon.svg`

If you export a newer resume PDF later, replace the file in `assets/resume/` and keep the same filename.

## GitHub Pages

This repository already has `origin` configured:

```bash
git remote -v
```

To publish:

1. Commit and push `main`.
2. In GitHub, open the repository settings.
3. Under **Pages**, set the source to **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save and wait for the Pages URL to appear.

Because the site uses only relative asset paths, it will work correctly as a GitHub Pages project site.
