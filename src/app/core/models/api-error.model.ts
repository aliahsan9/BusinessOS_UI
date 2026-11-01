import { HttpErrorResponse } from '@angular/common/http';

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
  errors?: Record<string, string[]> | string[];
}

export interface ApiErrorResponse {
  error: ApiError;
}

const unreachableDetail =
  'The API is unavailable. Start the backend with "dotnet run" in BusinessOS.API (http://localhost:5162), then try again.';

export function fromHttpError(error: HttpErrorResponse): ApiError {
  if (error.status === 0) {
    return {
      status: 0,
      title: 'Cannot reach server',
      detail: unreachableDetail,
    };
  }

  if (error.error && typeof error.error === 'object') {
    const body = error.error as Partial<ApiError> & { errors?: unknown };
    const fromErrors = errorMessages(body.errors);
    if (body.status || body.title || body.detail || fromErrors) {
      return {
        type: body.type,
        status: body.status ?? error.status,
        title: body.title || error.statusText || 'Request failed',
        detail: body.detail || fromErrors,
        instance: body.instance,
        traceId: body.traceId,
        errorCode: body.errorCode,
        resource: body.resource,
        currentUsage: body.currentUsage,
        maximum: body.maximum,
        upgradeSuggestion: body.upgradeSuggestion,
        errors: isFieldErrors(body.errors) ? body.errors : undefined,
      };
    }
  }

  if (error.status === 500 && (!error.error || typeof error.error === 'string')) {
    return {
      status: 500,
      title: 'Server unavailable',
      detail: unreachableDetail,
    };
  }

  return {
    status: error.status,
    title: error.statusText || 'An unexpected error occurred',
    detail: error.message,
  };
}

function errorMessages(errors: unknown): string | undefined {
  if (Array.isArray(errors)) {
    const messages = errors.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return messages.length ? messages.join(' ') : undefined;
  }

  if (errors && typeof errors === 'object') {
    const messages = Object.values(errors as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return messages.length ? messages.join(' ') : undefined;
  }

  return undefined;
}

function isFieldErrors(errors: unknown): errors is Record<string, string[]> {
  return !!errors && typeof errors === 'object' && !Array.isArray(errors);
}
