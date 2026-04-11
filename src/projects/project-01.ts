import type { Project } from "./types";

export const project01: Project = {
  slug: "projeto-01",
  title: "Projeto 01 | Minha felicidade",
  summary: "Primeira versao animada em p5.js do grafico autobiografico (1977, 2017, 2027).",
  status: "published",
  render: () => `
<section data-project-stage>
  <h2>Minha felicidade</h2>
  <p>Primeira versao animada do grafico em p5.js, com traco manual e narrativa em tres tempos. A animacao roda uma vez; clique no grafico para replay.</p>
  <div
    id="project-01-canvas"
    data-p5-canvas
    role="img"
    aria-label="Grafico autobiografico com area azul entre 1977 e 2017 abaixo do eixo e area rosa crescente ate 2027 acima do eixo."
  ></div>
  <figure data-project-original>
    <img
      src="/assets/projects/projeto-01-original.jpeg"
      alt="Foto da versao fisica original do Projeto 01, desenhada em caderno quadriculado."
      loading="lazy"
      decoding="async"
    />
    <figcaption>Versao fisica original do exercicio</figcaption>
  </figure>
</section>
<script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js" defer></script>
<script src="/assets/projects/projeto-01.js" defer></script>
`,
};
