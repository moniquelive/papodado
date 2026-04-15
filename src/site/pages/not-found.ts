import Mustache from "mustache";
import notFoundPageTemplateSource from "../templates/pages/not-found.mustache";

type NotFoundPageTemplateInput = {
  pathname: string;
};

Mustache.parse(notFoundPageTemplateSource);

export function renderNotFoundPage(pathname: string): string {
  const templateInput: NotFoundPageTemplateInput = { pathname };

  return Mustache.render(notFoundPageTemplateSource, templateInput);
}
