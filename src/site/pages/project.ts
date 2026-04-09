import type { Project, ProjectStatus } from "../../projects/types";
import { escapeHtml } from "../escape-html";

const statusText: Record<ProjectStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

export function renderProjectPage(project: Project): string {
  const status = escapeHtml(statusText[project.status]);
  const title = escapeHtml(project.title);
  const summary = escapeHtml(project.summary);

  return `
<p><a href="/">Voltar para o indice</a></p>
<section>
  <header>
    <p><small>${status}</small></p>
    <h1>${title}</h1>
    <p>${summary}</p>
  </header>
</section>
${project.render()}
`;
}
