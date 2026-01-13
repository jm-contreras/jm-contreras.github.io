# Juan Manuel Contreras — Personal Website

This repository contains a minimal, fast, static personal website designed for deployment on GitHub Pages. It uses a hybrid single-page + multi-page architecture.

## Structure
- `index.html` — single-scroll homepage with anchored sections
- `about.html` — full bio & CV
- `publications.html` — publications list
- `projects.html` — (removed) projects consolidated on the homepage (Aymara)
- `blog.html` — writing / blog index
- `assets/` — CSS, JS, images
- `content/` — JSON content for easy updates
- `CNAME` — put `juanmanuel.ai` here for custom domain
- `.nojekyll` — prevents GitHub Pages from ignoring files starting with `_`

## How to publish to GitHub Pages
1. Push this repo to GitHub (already in `main` branch).
2. In the repo **Settings → Pages** select branch `main` and folder `/ (root)`.
3. Optionally add a custom domain (e.g., `juanmanuel.ai`) and create a `CNAME` file (already present).
4. Wait a minute — GitHub Pages will serve the site at `https://<your-username>.github.io/<repo>` or the custom domain.

## Editing content
- Small content (homepage text, hero, etc.) can be edited directly in the HTML files.
- Publications are listed in `publications.html` and a canonical JSON exists in `/content/` for easy updates; the blog pulls recent posts from your Medium RSS feed (`@juanmaphd`) at runtime, or can be converted to pre-rendered Markdown/HTML if you prefer.
- To update the CV, replace `assets/cv.pdf` and update the link in `about.html`.

## SEO & performance tips
- Keep images small and use modern formats (.webp) where possible.
- Add actual publication pages or DOI links for each paper.
- Consider a simple build step (e.g., using a Node script) if you prefer writing posts in Markdown and producing static HTML pages.

## Mapping to `juanmanuel.ai`
- Add `juanmanuel.ai` to the `CNAME` file (already set).
- Create DNS A records pointing to GitHub Pages IPs or add an ALIAS/CNAME per GitHub docs.
- Enable HTTPS in GitHub Pages settings after DNS is configured.

## Notes
- Customize social links and email address in `index.html` and other pages.
- This is intentionally minimal: no build step required and no server-side code.

If you'd like, I can add a small Node script to convert Markdown posts to HTML and auto-generate the blog archive for better authoring experience. Open to next steps.
