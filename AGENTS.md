# Agent Notes

## Execution

- Always run commands through mise (`mise exec -- ...` or `mise run ...`).
- Preferred workflow:
  1. `mise install`
  2. `mise run install`
  3. `mise run dev`
- Use `mise run check` before handoff.
- Sketch bundling is part of npm scripts (`build:sketches`), so `dev`, `deploy`, and `check` all build sketches first.

## Architecture

- Runtime entrypoint: `src/index.ts`
- Project modules: `src/projects/*.ts`
- Shared page rendering: `src/site/*`
- Static assets: `public/*` (served by `[assets]` in `wrangler.toml`).
- p5 project code is TypeScript-first under `public/assets/projects/*.ts` and bundled to browser JS in the same folder.

## p5 sketches

- Keep sketch code modular with typed helpers (`*.constants.ts`, `*.geometry.ts`, `*.math.ts`, `*.primitives.ts`, `*.story.ts`, `*.types.ts`).
- Treat generated `public/assets/projects/*.js` as build artifacts; make source changes in `.ts` files.
- Prefer eased motion curves over linear animation for visual storytelling.
- Keep text rendered inside sketches aligned with the site body font.

## Adding course projects

- Keep each project in its own module file under `src/projects/`.
- Register each module in `src/projects/index.ts`.
- Keep project count small and explicit in the registry (expected < 5).
- For p5 projects, include a standalone sketch entrypoint under `public/assets/projects/` and load only the bundled JS from the project module.
- Use `status: "published"` for live project pages (avoid leaving published work marked as draft).

## Remotes

- `origin` is GitHub upstream (`main` tracks `origin/main`).
- `codeberg` is a mirror remote when configured.

## Styling

- Never use inline `<style>` tags in HTML templates.
- Prefer regular CSS cascading to override library styles.
- Keep the home page on a single dark theme using a feminine palette defined with CSS variables.
- Use distinct fonts for headings and body text.
