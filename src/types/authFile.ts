/**
 * 认证文件相关类型
 * 基于原项目 src/modules/auth-files.js
 */

import type { RecentRequestBucket } from '@/utils/recentRequests';

export type AuthFileType =
  | 'qwen'
  | 'kimi'
  | 'gemini'
  | 'aistudio'
  | 'claude'
  | 'codex'
  | 'antigravity'
  | 'xai'
  | 'iflow'
  | 'vertex'
  | 'empty'
  | 'unknown';

export interface AuthFileItem {
  name: string;
  type?: AuthFileType | string;
  provider?: string;
  size?: number;
  authIndex?: string | number | null;
  runtimeOnly?: boolean | string;
  disabled?: boolean;
  unavailable?: boolean;
  refresh_token_locked?: boolean;
  refreshTokenLocked?: boolean;
  status?: string;
  statusMessage?: string;
  last_error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    http_status?: number;
  };
  lastError?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    httpStatus?: number;
  };
  last_error_http_status?: number;
  lastErrorHttpStatus?: number;
  lastRefresh?: string | number;
  modified?: number;
  success?: unknown;
  failed?: unknown;
  recent_requests?: RecentRequestBucket[];
  recentRequests?: RecentRequestBucket[];
  [key: string]: unknown;
}

export interface AuthFilesResponse {
  files: AuthFileItem[];
  total?: number;
}
