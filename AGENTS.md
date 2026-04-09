# Agent Notes

## Execution

- Always run commands through mise (`mise exec -- ...` or `mise run ...`).
- Preferred workflow:
  1. `mise install`
  2. `mise run install`
  3. `mise run dev`

## Architecture

- Runtime entrypoint: `src/index.ts`
- Project modules: `src/projects/*.ts`
- Shared page rendering: `src/site/*`

## Adding course projects

- Keep each project in its own module file under `src/projects/`.
- Register each module in `src/projects/index.ts`.
- Keep project count small and explicit in the registry (expected < 5).

## Styling

- Never use inline `<style>` tags in HTML templates.
- Prefer regular CSS cascading to override library styles.
- Keep the home page on a single dark theme using a feminine palette defined with CSS variables.
- Use distinct fonts for headings and body text.
