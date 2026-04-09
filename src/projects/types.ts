export type ProjectStatus = "draft" | "published";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  render: () => string;
};
