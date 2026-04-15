import Mustache from "mustache";
import project02TemplateSource from "../site/templates/projects/project-02.mustache";
import type { Project } from "./types";

Mustache.parse(project02TemplateSource);

export const project02: Project = {
  slug: "projeto-02",
  title: "Visualização digital de dados públicos",
  summary: "Segunda entrega iniciada com um embed interativo publicado no Flourish.",
  status: "published",
  render: () => Mustache.render(project02TemplateSource, {}),
};
