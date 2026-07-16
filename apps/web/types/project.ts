export type ProjectStatus =
  | "active"
  | "inactive"
  | "archived";

export interface Project {
  id: string;
  organization_id: string;

  name: string;
  slug: string;
  description: string | null;

  status: ProjectStatus;

  created_by?: string;

  created_at: string;
  updated_at: string;

  knowledge_base_count?: number;
  document_count?: number;
  member_count?: number;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}