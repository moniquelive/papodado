import { project01 } from "./project-01";
import { project02 } from "./project-02";
import type { Project } from "./types";

const projects: Project[] = [project01, project02];
const projectsBySlug = new Map(projects.map((project) => [project.slug, project]));

export function listProjects(): Project[] {
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projectsBySlug.get(slug);
}
