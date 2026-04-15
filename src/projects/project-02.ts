import type { Project } from "./types";

export const project02: Project = {
  slug: "projeto-02",
  title: "Visualiza\u00e7\u00e3o digital de dados p\u00fablicos",
  summary: "Segunda entrega iniciada com um embed interativo publicado no Flourish.",
  status: "published",
  render: () => `
<section data-project-stage>
  <h2>Visualiza\u00e7\u00e3o digital de dados p\u00fablicos</h2>
  <p>Primeira versao do segundo projeto, incorporada diretamente do Flourish Studio.</p>
  <div data-flourish-wrapper>
    <div class="flourish-embed flourish-chart" data-src="visualisation/28544241">
      <script src="https://public.flourish.studio/resources/embed.js"></script>
      <noscript>
        <img
          src="https://public.flourish.studio/visualisation/28544241/thumbnail"
          width="100%"
          alt="Visualizacao do Projeto 02 publicada no Flourish."
        />
      </noscript>
    </div>
  </div>
</section>
`,
};
