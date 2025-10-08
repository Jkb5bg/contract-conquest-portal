export interface User {
  email: string;
  client_id: string;
  user_id: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_password_temporary: boolean;
  client_id: string;
}

export interface AuthTokens {
  access: string | null;
  refresh: string | null;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}
