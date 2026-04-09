# PapoDado on Cloudflare Workers

This repository is ready to publish course projects for:

https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados

The site uses:

- Cloudflare Workers
- Oat UI (`@knadh/oat`) via CDN
- A modular project registry for a small set of pages (under 5 projects)

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

- `src/index.ts`: Worker router and HTTP responses.
- `src/projects/`: one module per project page.
- `src/site/`: shared layout and page renderers.
- `src/site/styles.ts`: global stylesheet served at `/assets/site.css`.

Current routes:

- `/` project index
- `/projects/projeto-01` empty starter page
- `/healthz` simple health check

## Add a new project page

1. Copy `src/projects/project-01.ts` to a new file in `src/projects/`.
2. Update `slug`, `title`, `summary`, and `render()`.
3. Import the new module in `src/projects/index.ts` and add it to the `projects` array.

Run checks:

```bash
mise run check
```
