# PapoDado project site

This repository is ready to publish course projects for:

https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados

The site uses:

- A modular project registry for a small set of pages (under 5 projects)
- Semantic HTML with a custom themed stylesheet
- p5.js for standalone project sketches

## Quick start

1. Install tool versions:

   ```bash
   mise install
   ```

2. Install dependencies:

   ```bash
   mise run install
   ```

3. Start local worker dev server:

   ```bash
   mise run dev
   ```

## Deploy

```bash
mise run deploy
```

Before first deploy, authenticate wrangler if needed:

```bash
mise exec -- wrangler login
```

## Project structure

- `src/index.ts`: app router and HTTP responses.
- `src/projects/`: one module per project page.
- `src/site/`: shared layout and page renderers.
- `src/site/styles.ts`: global stylesheet served at `/assets/site.css`.
- `public/`: static assets served directly (including built sketch bundles).

Current routes:

- `/` project index
- `/projects/projeto-01` animated p5.js chart (first draft)
- `/healthz` simple health check

## Add a new project page

1. Copy `src/projects/project-01.ts` to a new file in `src/projects/`.
2. Update `slug`, `title`, `summary`, and `render()`.
3. Import the new module in `src/projects/index.ts` and add it to the `projects` array.

Run checks:

```bash
mise run check
```

Project sketches are authored in TypeScript (for example `public/assets/projects/projeto-01.ts`) and bundled to browser-ready JS via `npm run build:sketches`.
