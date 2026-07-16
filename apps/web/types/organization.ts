export type OrganizationStatus =
  | "active"
  | "inactive"
  | "suspended";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  owner_id?: string;
  status: OrganizationStatus;

  created_at: string;
  updated_at: string;

  member_count?: number;
  project_count?: number;
}

export interface OrganizationListResponse {
  items: Organization[];
  total: number;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}