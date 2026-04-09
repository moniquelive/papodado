import type { Project, ProjectStatus } from "../../projects/types";
import { escapeHtml } from "../escape-html";

const COURSE_URL =
  "https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados";
const SITE_URL = "https://papodado.monique.dev";

const statusText: Record<ProjectStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

export function renderHomePage(projects: Project[]): string {
  const cards =
    projects.length === 0
      ? "<p>Nenhum projeto cadastrado ainda.</p>"
      : `<ul data-project-list>${projects
          .map((project) => {
            const slug = escapeHtml(project.slug);
            const title = escapeHtml(project.title);
            const summary = escapeHtml(project.summary);
            const status = escapeHtml(statusText[project.status]);

            return `<li>
  <article data-project-card>
    <header>
      <p><small data-project-status data-status="${project.status}">${status}</small></p>
      <h3><a href="/projects/${slug}">${title}</a></h3>
      <p>${summary}</p>
    </header>
    <footer>
      <a href="/projects/${slug}">Abrir projeto</a>
    </footer>
  </article>
</li>`;
          })
          .join("")}</ul>`;

  return `
<section data-home-hero>
  <p data-home-kicker>PapoDado | Visualizacao Artistica de Dados</p>
  <h1>Laboratorio visual de Monique Oliveira</h1>
  <p>Espaco oficial para publicar os projetos do curso com estrutura modular e implantacao dedicada.</p>
  <p>Uma base pequena e curada para poucos trabalhos, cada um em sua propria rota.</p>
  <p data-home-links>
    <a href="${SITE_URL}" target="_blank" rel="noreferrer">papodado.monique.dev</a>
    <a href="${COURSE_URL}" target="_blank" rel="noreferrer">Pagina do curso</a>
  </p>
</section>
<section>
  <h2>Indice de projetos</h2>
  <p>Selecione um projeto para abrir a pagina dedicada.</p>
  ${cards}
</section>
`;
}
