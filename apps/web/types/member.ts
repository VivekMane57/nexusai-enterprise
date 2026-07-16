export type OrganizationRole =
  | "owner"
  | "admin"
  | "ai_engineer"
  | "reviewer"
  | "viewer";

export type MembershipStatus =
  | "active"
  | "suspended";

export interface MemberUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;

  role: OrganizationRole;
  status: MembershipStatus;

  joined_at: string;
  created_at: string;
  updated_at: string;

  user: MemberUser;
}

export interface OrganizationMemberCreateRequest {
  email: string;
  role?: OrganizationRole;
}

export interface OrganizationMemberUpdateRequest {
  role?: OrganizationRole | null;
  status?: MembershipStatus | null;
}

export interface OrganizationOption {
  id: string;
  name: string;
  description?: string | null;
  member_count?: number;
}