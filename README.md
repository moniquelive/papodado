# PapoDado project site

This repository publishes course projects for:

https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados

The site is now built with Hugo and deployed with Cloudflare Workers static assets.

## Quick start

1. Install tool versions:

   ```bash
   mise install
   ```

2. Install dependencies:

   ```bash
   mise run install
   ```

3. Build sketches + Hugo output and run checks:

   ```bash
   mise run check
   ```

4. Start local Worker dev server (serving `dist/` assets):

   ```bash
   mise run dev
   ```

## Build and deploy

Build static output:

```bash
mise exec -- npm run build
```

Deploy Worker + static assets:

```bash
mise run deploy
```

Before first deploy, authenticate wrangler if needed:

```bash
mise exec -- wrangler login
```

## Project structure

- `hugo.toml`: Hugo site configuration and shared params.
- `content/projects/*.md`: one content file per project page.
- `layouts/`: Hugo templates and shortcodes.
- `assets/css/site.css`: global stylesheet processed by Hugo.
- `assets/projects/*.ts`: TypeScript source for p5 sketches.
- `static/assets/projects/`: runtime assets copied as-is (images, built sketch JS).
- `src/index.ts`: minimal Worker entrypoint (`/healthz` + static asset fallback).
- `dist/`: generated Hugo output used by wrangler assets binding.

Current routes:

- `/` project index
- `/projects/` projects list
- `/projects/projeto-01/` animated p5.js chart
- `/projects/projeto-02/` Flourish embed project
- `/healthz` simple health check

## Add a new project page

1. Scaffold with the project archetype:

   ```bash
   mise exec -- npx hugo new content/projects/<slug>.md
   ```

2. Fill front matter (`title`, `summary`, `status`, `weight`) and page content.
3. Use existing shortcodes from `layouts/shortcodes/` (or add a new one if needed).
4. Keep `status: "published"` for live pages.
5. Run checks:

   ```bash
   mise run check
   ```

Current templates use canonical, Open Graph, and Twitter metadata from `layouts/_default/baseof.html`.

Sketches are authored in TypeScript (for example `assets/projects/projeto-01.ts`) and bundled to browser-ready JS in `static/assets/projects/` via `npm run build:sketches`.
