# Juan Manuel Contreras — Personal Website

Static site served from GitHub Pages at [juanma.phd](https://juanma.phd). No build step.

## Structure
- `index.html` — single-scroll homepage with anchored sections (About, Experience, Writing, Speaking, Contact).
- `writing/index.html` — Writing page (Research, Essays, Creative).
- `writing/<slug>/index.html` — self-hosted blog posts.
- `speaking/index.html` — Speaking page.
- `assets/` — CSS, JS, images, PDFs.
  - `assets/img/posts/<slug>/` — images for individual blog posts.
- `content/` — JSON content consumed by `assets/js/site.js`:
  - `writing.json` — `medium_posts` (auto-pulled from Medium RSS) + `local_posts` (self-hosted).
  - `speaking.json` — talks and podcast appearances.
- `scripts/update-medium-posts.js` — refreshes `medium_posts` from Medium RSS; preserves `local_posts`.
- `drafts/` — gitignored; markdown drafts for posts before they're rendered to HTML.
- `CNAME` — `juanma.phd` (custom domain).

## Adding a new self-hosted blog post
1. Draft in `drafts/<slug>.md`.
2. Render to HTML at `writing/<slug>/index.html` (model after the existing post page).
3. Drop images in `assets/img/posts/<slug>/`.
4. Append an entry to `local_posts` in `content/writing.json` (slug, title, url, date, tags, excerpt, image).
5. Add the URL to `sitemap.xml`.
6. The Essays / Creative lists on `/writing` and the homepage Featured slots will pick it up automatically based on its `tags` field.

## Updating Medium posts
Run `node scripts/update-medium-posts.js` (requires `xml2js`). This refreshes `medium_posts` and preserves `local_posts`.

## Deploy
Push to `main`. GitHub Pages serves from root.
