import { escapeHtml } from "../escape-html";

export function renderNotFoundPage(pathname: string): string {
  return `
<section>
  <h1>Pagina nao encontrada</h1>
  <p>O caminho <code>${escapeHtml(pathname)}</code> nao existe.</p>
  <p><a href="/">Voltar para a pagina inicial</a></p>
</section>
`;
}
