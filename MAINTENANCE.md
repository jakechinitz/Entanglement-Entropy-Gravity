# Maintenance Guide

This document explains how to keep the entanglement-entropy gravity site updated.

## 1. Updating existing papers

Each paper has:

- A LaTeX source in `latex/paperN.tex`
- A template page in `paperN.html` containing the marker:

  `<!-- PAPERN_CONTENT -->`

When you update a paper:

1. Edit the corresponding LaTeX file in `latex/`.
2. Commit and push to `main`.

The GitHub Actions workflow will:

- Run Pandoc on each `latex/paperN.tex` → `build/paperN.fragment.html`
- Replace the `<!-- PAPERN_CONTENT -->` marker in `paperN.html`
- Write the final page to `docs/paperN.html`

The site will update automatically once GitHub Pages rebuilds.

## 2. Adding a new paper (Paper VII, etc.)

1. Add a new LaTeX source, e.g.:

   `latex/paper7.tex`

2. Create a new template page `paper7.html` by copying one of the existing
   `paper*.html` files and updating:

   - `<title>` and meta description
   - The `<h1>` title and abstract
   - The JSON-LD metadata (`headline`, `name`, `url`)
   - The navigation bar so `VII` appears

   Include the marker:

   `<!-- PAPER7_CONTENT -->`

3. Update the workflow, sitemap, and navigation:

   - In `.github/workflows/build-and-deploy.yml`, extend the loop `for i in 1 2 3 4 5 6`
     to include `7`.
   - In `sitemap.xml`, add a `<url>` entry for `paper7.html`.
   - In `index.html`, update the inline paper chips and sidebar to include Paper VII.

4. Commit and push. The pipeline will pick up the new paper and deploy it.

## 3. Changing the domain / repo name

If you change your GitHub username or repository name:

- Update the base URL in:

  - `sitemap.xml`
  - The JSON-LD `url` fields in each `paper*.html` and `index.html`
  - `robots.txt`

- Reconfigure GitHub Pages to serve from `docs/` on `main`.

## 4. Tuning Pandoc

If a paper uses advanced LaTeX or custom packages:

- You can add a custom Pandoc command-line or `--include-in-header` files
  directly in the workflow step:

  ```bash
  pandoc latex/paper1.tex \
    --from=latex \
    --to=html5 \
    --mathjax \
    --quiet \
    -o build/paper1.fragment.html
  ```

## 5. Testing locally

To preview the site locally before pushing:

```bash
# Install pandoc if needed
# Then run the same build steps manually:
mkdir -p build docs
for i in 1 2 3 4 5 6; do
  if [ -f "latex/paper${i}.tex" ]; then
    pandoc "latex/paper${i}.tex" --from=latex --to=html5 --mathjax -o "build/paper${i}.fragment.html"
  else
    echo "<p><em>LaTeX source not yet provided.</em></p>" > "build/paper${i}.fragment.html"
  fi
done

# Then run python script to assemble, or just open index.html directly
python3 -m http.server 8000
# Visit http://localhost:8000
```
