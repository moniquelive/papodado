---
title: "Projeto 03 | Manchas que aprendem"
summary: "Rascunho em p5.js com ocorrências do Fogo Cruzado, bairros do Rio e uma camada orgânica inspirada em padrões de Turing."
status: "published"
weight: 3
---

{{< project-note >}}
[Padrões de Turing](https://pt.wikipedia.org/wiki/Padr%C3%A3o_de_Turing) são formas que emergem quando duas substâncias interagem localmente e se espalham em velocidades diferentes, criando manchas, listras e texturas orgânicas. Neste projeto, cada ocorrência do Fogo Cruzado funciona como uma semente sobre o mapa do Rio: os pontos alimentam uma grade visual, a intensidade se difunde, parte dela se dissipa e o resultado vira uma camada animada de memória urbana.
{{< /project-note >}}

{{< project-p5
  heading="Manchas que aprendem"
  description="Ocorrências reais de disparos de arma de fogo alimentam uma grade visual sobre os bairros do Rio. A difusão, a memória e a dissipação transformam pontos em manchas orgânicas temporais."
  container_id="project-03-canvas"
  aria_label="Mapa escuro dos bairros do Rio de Janeiro com pontos de ocorrências e manchas orgânicas animadas inspiradas em padrões de Turing."
  sketch_entry="projects/projeto-03.js"
>}}

### Dados

- Ocorrências: [Fogo Cruzado API v2](https://api.fogocruzado.org.br/docs/endpoint/occurrences), município do Rio de Janeiro, 2024-05-01 a 2026-04-30. Arquivo publicado: [JSON estático](/assets/projects/projeto-03-occurrences.json).
- Mapa: [limites de bairros da Prefeitura do Rio/Data.Rio](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Cartografia/Limites_administrativos/FeatureServer/4), convertido para GeoJSON em WGS84. Arquivo publicado: [GeoJSON estático](/assets/projects/projeto-03-bairros.geojson).
- Publicação: os dados foram salvos como arquivos estáticos; a página não faz chamadas autenticadas no navegador.
- Recorte ético: a visualização mostra intensidade de registros reportados, não previsão de crime nem perfilamento de lugares ou pessoas.
