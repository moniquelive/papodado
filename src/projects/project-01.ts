import Mustache from "mustache";
import project01TemplateSource from "../site/templates/projects/project-01.mustache";
import type { Project } from "./types";

Mustache.parse(project01TemplateSource);

export const project01: Project = {
  slug: "projeto-01",
  title: "Projeto 01 | Minha felicidade",
  summary: "Primeira versao animada em p5.js do grafico autobiografico (1977, 2017, 2027).",
  status: "published",
  render: () => Mustache.render(project01TemplateSource, {}),
};
