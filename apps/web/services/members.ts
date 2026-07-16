import { api } from "@/lib/api";

import type {
  OrganizationMember,
  OrganizationMemberCreateRequest,
  OrganizationMemberUpdateRequest,
  OrganizationOption,
} from "@/types/member";

interface OrganizationListResponse {
  items?: OrganizationOption[];
  total?: number;
}

function normalizeOrganizations(
  data:
    | OrganizationOption[]
    | OrganizationListResponse,
): OrganizationOption[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.items ?? [];
}

export async function getMemberOrganizations(): Promise<
  OrganizationOption[]
> {
  const response = await api.get<
    OrganizationOption[] | OrganizationListResponse
  >("/organizations");

  return normalizeOrganizations(
    response.data,
  );
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const response = await api.get<
    OrganizationMember[]
  >(
    `/organizations/${organizationId}/members`,
  );

  return response.data;
}

export async function addOrganizationMember(
  organizationId: string,
  payload: OrganizationMemberCreateRequest,
): Promise<OrganizationMember> {
  const response = await api.post<
    OrganizationMember
  >(
    `/organizations/${organizationId}/members`,
    payload,
  );

  return response.data;
}

export async function updateOrganizationMember(
  organizationId: string,
  membershipId: string,
  payload: OrganizationMemberUpdateRequest,
): Promise<OrganizationMember> {
  const response = await api.patch<
    OrganizationMember
  >(
    `/organizations/${organizationId}/members/${membershipId}`,
    payload,
  );

  return response.data;
}

export async function removeOrganizationMember(
  organizationId: string,
  membershipId: string,
): Promise<void> {
  await api.delete(
    `/organizations/${organizationId}/members/${membershipId}`,
  );
}