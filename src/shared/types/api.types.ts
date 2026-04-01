/**
 * API response type definitions.
 * Standardized response wrappers for pagination, errors, and success.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SearchParams extends PaginationParams {
  query: string;
  type?: 'users' | 'teams' | 'tournaments';
  role?: string;
}
