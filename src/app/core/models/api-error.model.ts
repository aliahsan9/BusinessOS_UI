export interface ApiError {
  type?: string;
  status: number;
  title: string;
  detail?: string;
  instance?: string;
  traceId?: string;
  errorCode?: string;
  resource?: string;
  currentUsage?: number;
  maximum?: number;
  upgradeSuggestion?: string;
  errors?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  error: ApiError;
}
