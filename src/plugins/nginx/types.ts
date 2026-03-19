export type NginxAction = 'restart' | 'status' | 'reload' | 'test';

export interface NginxArgs {
  action: NginxAction;
  service?: string;
}

export interface NginxResultRestart {
  action: 'restart';
  success: boolean;
  output: string;
  error: string | null;
}

export interface NginxResultStatus {
  action: 'status';
  running: boolean;
  output: string;
}

export interface NginxResultReload {
  action: 'reload';
  success: boolean;
}

export interface NginxResultTest {
  action: 'test';
  valid: boolean;
  output: string;
}

export interface NginxResultError {
  error: string;
}

export type NginxResult =
  | NginxResultRestart
  | NginxResultStatus
  | NginxResultReload
  | NginxResultTest
  | NginxResultError;
