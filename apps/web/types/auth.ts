export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_in?: number;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  access_token_expires_in?: number;
}

export interface LoginResponse
  extends AuthTokens {
  user?: User;
}