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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="https://unpkg.com/@knadh/oat/oat.min.css">
  <link rel="stylesheet" href="/assets/site.css">
  <script src="https://unpkg.com/@knadh/oat/oat.min.js" defer></script>
</head>
<body>
  <header role="banner">
    <nav aria-label="Navegacao principal">
      <a href="/" data-brand>papodado.monique.dev</a>
      <a href="/projects"${input.isHome ? " aria-current=\"page\"" : ""}>Projetos</a>
      <a href="${COURSE_URL}" target="_blank" rel="noreferrer">Pagina do curso</a>
    </nav>
  </header>
  <main>
    ${input.content}
  </main>
  <footer>
    <small>Monique Oliveira | PapoDado</small>
  </footer>
</body>
</html>`;
}
