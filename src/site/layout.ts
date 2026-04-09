import { escapeHtml } from "./escape-html";

const COURSE_URL =
  "https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados";

type LayoutInput = {
  title: string;
  description: string;
  isHome: boolean;
  content: string;
};

export function renderLayout(input: LayoutInput): string {
  const title = escapeHtml(input.title);
  const description = escapeHtml(input.description);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="https://unpkg.com/@knadh/oat/oat.min.css">
  <link rel="stylesheet" href="/assets/site.css">
  <script src="https://unpkg.com/@knadh/oat/oat.min.js" defer></script>
</head>
<body>
  <header role="banner">
    <nav aria-label="Navegacao principal">
      <a href="/"${input.isHome ? " aria-current=\"page\"" : ""}>Projetos PapoDado</a>
      <a href="${COURSE_URL}" target="_blank" rel="noreferrer">Pagina do curso</a>
    </nav>
  </header>
  <main>
    ${input.content}
  </main>
  <footer>
    <small>Cloudflare Workers + Oat UI.</small>
  </footer>
</body>
</html>`;
}
