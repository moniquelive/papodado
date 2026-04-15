import Mustache from "mustache";
import type { Project, ProjectStatus } from "../../projects/types";
import projectPageTemplateSource from "../templates/pages/project.mustache";

const statusText: Record<ProjectStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

type ProjectPageTemplateInput = {
  status: string;
  title: string;
  summary: string;
  projectBody: string;
};

Mustache.parse(projectPageTemplateSource);

export function renderProjectPage(project: Project): string {
  const templateInput: ProjectPageTemplateInput = {
    status: statusText[project.status],
    title: project.title,
    summary: project.summary,
    projectBody: project.render(),
  };

  return Mustache.render(projectPageTemplateSource, templateInput);
}
