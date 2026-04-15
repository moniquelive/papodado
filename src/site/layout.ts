import Mustache from "mustache";
import layoutTemplateSource from "./templates/layout.mustache";

const COURSE_URL =
  "https://eavparquelage.rj.gov.br/curso/papodado-visualizacao-artistica-de-dados";

type LayoutInput = {
  title: string;
  description: string;
  isHome: boolean;
  content: string;
};

type LayoutTemplateInput = LayoutInput & {
  courseUrl: string;
};

Mustache.parse(layoutTemplateSource);

export function renderLayout(input: LayoutInput): string {
  const templateInput: LayoutTemplateInput = {
    ...input,
    courseUrl: COURSE_URL,
  };

  return Mustache.render(layoutTemplateSource, templateInput);
}
