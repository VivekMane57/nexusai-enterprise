import { api } from "@/lib/api";
import type {
  CreateOrganizationRequest,
  Organization,
  OrganizationListResponse,
} from "@/types/organization";

function normalizeOrganizationList(
  data:
    | Organization[]
    | OrganizationListResponse,
): OrganizationListResponse {
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

export async function getOrganizations(): Promise<OrganizationListResponse> {
  const response = await api.get<
    Organization[] | OrganizationListResponse
  >("/organizations");

  return normalizeOrganizationList(
    response.data,
  );
}

export async function getOrganization(
  organizationId: string,
): Promise<Organization> {
  const response =
    await api.get<Organization>(
      `/organizations/${organizationId}`,
    );

  return response.data;
}

export async function createOrganization(
  payload: CreateOrganizationRequest,
): Promise<Organization> {
  const response =
    await api.post<Organization>(
      "/organizations",
      payload,
    );

  return response.data;
}