import { api } from "@/lib/api";
import type {
  CreateProjectRequest,
  Project,
  ProjectListResponse,
} from "@/types/project";

function normalizeProjectList(
  data:
    | Project[]
    | ProjectListResponse,
): ProjectListResponse {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
    };
  }

  return {
    items: data.items ?? [],
    total:
      data.total ??
      data.items?.length ??
      0,
  };
}

export async function getOrganizationProjects(
  organizationId: string,
): Promise<ProjectListResponse> {
  const response = await api.get<
    Project[] | ProjectListResponse
  >(
    `/organizations/${organizationId}/projects`,
  );

  return normalizeProjectList(
    response.data,
  );
}

export async function createProject(
  organizationId: string,
  payload: CreateProjectRequest,
): Promise<Project> {
  const response =
    await api.post<Project>(
      `/organizations/${organizationId}/projects`,
      payload,
    );

  return response.data;
}

export async function getProject(
  projectId: string,
): Promise<Project> {
  const response =
    await api.get<Project>(
      `/projects/${projectId}`,
    );

  return response.data;
}