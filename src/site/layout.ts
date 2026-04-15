import Mustache from "mustache";
import layoutTemplateSource from "./templates/layout.mustache";

const COURSE_URL =
  "https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados";
const GITHUB_REPO_URL = "https://github.com/moniquelive/papodado";

type LayoutInput = {
  title: string;
  description: string;
  isHome: boolean;
  content: string;
};

type LayoutTemplateInput = LayoutInput & {
  courseUrl: string;
  githubUrl: string;
};

Mustache.parse(layoutTemplateSource);

export function renderLayout(input: LayoutInput): string {
  const templateInput: LayoutTemplateInput = {
    ...input,
    courseUrl: COURSE_URL,
    githubUrl: GITHUB_REPO_URL,
  };

  return Mustache.render(layoutTemplateSource, templateInput);
}
