import type { Project } from "./types";

export const project01: Project = {
  slug: "projeto-01",
  title: "Projeto 01",
  summary: "Pagina vazia para publicar a primeira visualizacao.",
  status: "draft",
  render: () => `
<section>
  <h2>Espaco do projeto</h2>
  <div data-empty-canvas aria-label="area vazia do projeto">
    <p><small>Conteudo ainda nao publicado.</small></p>
  </div>
</section>
`,
};
