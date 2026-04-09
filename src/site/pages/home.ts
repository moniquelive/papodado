import type { Project, ProjectStatus } from "../../projects/types";
import { escapeHtml } from "../escape-html";

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
      <p><small>${status}</small></p>
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
<section>
  <h1>Projetos do curso PapoDado</h1>
  <p>Estrutura modular para publicar projetos de visualizacao artistica de dados no Cloudflare Workers.</p>
  <p>Use a lista abaixo para acessar cada pagina de projeto.</p>
</section>
<section>
  <h2>Indice de projetos</h2>
  ${cards}
</section>
`;
}
