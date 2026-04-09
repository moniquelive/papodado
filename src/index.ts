import { getProjectBySlug, listProjects } from "./projects";
import { renderLayout } from "./site/layout";
import { renderHomePage } from "./site/pages/home";
import { renderNotFoundPage } from "./site/pages/not-found";
import { renderProjectPage } from "./site/pages/project";
import { siteCss } from "./site/styles";

const htmlHeaders = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
};

const cssHeaders = {
  "content-type": "text/css; charset=utf-8",
  "cache-control": "public, max-age=600",
};

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: htmlHeaders });
}

function cssResponse(body: string): Response {
  return new Response(body, { status: 200, headers: cssHeaders });
}

function homeResponse(): Response {
  const body = renderLayout({
    title: "PapoDado | Projetos",
    description: "Projetos do curso PapoDado no Cloudflare Workers.",
    isHome: true,
    content: renderHomePage(listProjects()),
  });

  return htmlResponse(body);
}

function projectResponse(slug: string): Response {
  const project = getProjectBySlug(slug);

  if (!project) {
    return notFoundResponse(`/projects/${slug}`);
  }

  const body = renderLayout({
    title: `${project.title} | PapoDado`,
    description: project.summary,
    isHome: false,
    content: renderProjectPage(project),
  });

  return htmlResponse(body);
}

function notFoundResponse(pathname: string): Response {
  const body = renderLayout({
    title: "Pagina nao encontrada | PapoDado",
    description: "A rota solicitada nao existe.",
    isHome: false,
    content: renderNotFoundPage(pathname),
  });

  return htmlResponse(body, 404);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (pathname === "/" || pathname === "/projects") {
      return homeResponse();
    }

    if (pathname === "/assets/site.css") {
      return cssResponse(siteCss);
    }

    if (pathname === "/healthz") {
      return new Response("ok", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (pathname.startsWith("/projects/")) {
      const slug = pathname.slice("/projects/".length);
      if (!slug) {
        return homeResponse();
      }

      return projectResponse(slug);
    }

    return notFoundResponse(pathname);
  },
};
