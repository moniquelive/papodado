# Agent Notes

## Execution

- Always run commands through mise (`mise exec -- ...` or `mise run ...`).
- Preferred workflow:
  1. `mise install`
  2. `mise run install`
  3. `mise run dev`
- Use `mise run check` before handoff.
- Sketch bundling is part of Hugo resources (`js.Build`) during site build, so `dev`, `deploy`, and `check` all include it.

## Architecture

- Runtime entrypoint: `src/index.js`
- Site content: `content/projects/*.md`
- Shared page rendering: `layouts/*` and `layouts/shortcodes/*`
- Static assets: `static/*` (copied to `dist/` by Hugo, served by `[assets]` in `wrangler.toml`).
- p5 project code is JavaScript-first under `assets/projects/*.js` and bundled by Hugo resources into `dist/assets/projects/`.

## p5 sketches

- Keep sketch code modular with helper modules (`*.constants.js`, `*.geometry.js`, `*.math.js`, `*.primitives.js`, `*.story.js`).
- Treat generated `dist/assets/projects/*.js` as build artifacts; make source changes in `assets/projects/*.js` files.
- Prefer eased motion curves over linear animation for visual storytelling.
- Keep text rendered inside sketches aligned with the site body font.

## Adding course projects

- Keep each project in its own content file under `content/projects/`.
- Use front matter (`title`, `summary`, `status`, `weight`) as the project registry.
- Keep project count small and explicit in the project section (expected < 5).
- For p5 projects, include a standalone sketch entrypoint under `assets/projects/` and load only Hugo-bundled JS from the shortcode pipeline.
- Use `status: "published"` for live project pages (avoid leaving published work marked as draft).

## Remotes

- `origin` is GitHub upstream (`main` tracks `origin/main`).
- `codeberg` is a mirror remote when configured.
- Always push branch updates to both remotes (`origin` and `codeberg`) using the same branch name.
- If one remote is missing or a push fails, report it clearly in the handoff.

## Styling

- Never use inline `<style>` tags in HTML templates.
- Prefer regular CSS cascading to override library styles.
- Keep the home page on a single dark theme using a feminine palette defined with CSS variables.
- Use distinct fonts for headings and body text.
- Use correct Portuguese diacritics in public-facing Portuguese copy, including Markdown content and text drawn inside sketches.
