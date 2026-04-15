import Mustache from "mustache";
import type { Project } from "../../projects/types";
import homePageTemplateSource from "../templates/pages/home.mustache";

const COURSE_URL =
  "https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados";
const SITE_URL = "https://papodado.monique.dev";

type ProjectCardInput = {
  slug: string;
  title: string;
  summary: string;
};

type HomePageTemplateInput = {
  hasProjects: boolean;
  projects: ProjectCardInput[];
  courseUrl: string;
  siteUrl: string;
};

Mustache.parse(homePageTemplateSource);

export function renderHomePage(projects: Project[]): string {
  const projectCards: ProjectCardInput[] = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary,
  }));

  const templateInput: HomePageTemplateInput = {
    hasProjects: projectCards.length > 0,
    projects: projectCards,
    courseUrl: COURSE_URL,
    siteUrl: SITE_URL,
  };

  return Mustache.render(homePageTemplateSource, templateInput);
}
