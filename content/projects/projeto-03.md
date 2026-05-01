---
title: "Projeto 03 | Manchas que aprendem"
summary: "Rascunho em p5.js com ocorrencias do Fogo Cruzado, bairros do Rio e uma camada organica inspirada em padroes de Turing."
status: "published"
weight: 3
---

{{< project-p5
  heading="Manchas que aprendem"
  description="Ocorrencias reais de disparos de arma de fogo alimentam uma grade visual sobre os bairros do Rio. A difusao, a memoria e a dissipacao transformam pontos em manchas organicas temporais."
  container_id="project-03-canvas"
  aria_label="Mapa escuro dos bairros do Rio de Janeiro com pontos de ocorrencias e manchas organicas animadas inspiradas em padroes de Turing."
  sketch_entry="projects/projeto-03.js"
>}}

### Dados

- Ocorrencias: Fogo Cruzado API v2, municipio do Rio de Janeiro, 2024-05-01 a 2026-04-30.
- Mapa: limites de bairros da Prefeitura do Rio/Data.Rio, convertido para GeoJSON em WGS84.
- Publicacao: os dados foram salvos como JSON estatico; a pagina nao faz chamadas autenticadas no navegador.
- Recorte etico: a visualizacao mostra intensidade de registros reportados, nao previsao de crime nem perfilamento de lugares ou pessoas.
