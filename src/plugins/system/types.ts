export const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;

export interface SystemArgs {
  info?: 'all' | 'cpu' | 'memory' | 'disk' | 'network';
  action?: 'create_user' | 'delete_user' | 'list_users' | 'user_exists';
  secure?: boolean;
  force_dscl_fallback?: boolean;
  remove_secure_token?: boolean;
  password?: string;
  admin_user?: string;
  admin_password?: string;
  username?: string;
  fullname?: string;
  admin?: boolean;
  [key: string]: unknown;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  success: boolean;
  error?: string;
  returncode: number;
  [key: string]: unknown;
}

export interface MacUserState {
  exists: boolean;
  listed: boolean;
  dsclReadable: boolean;
  idResolves: boolean;
  listedOnly: boolean;
  listError?: string;
}

export interface SecureTokenStatus {
  enabled: boolean;
  known: boolean;
  raw: string;
}
