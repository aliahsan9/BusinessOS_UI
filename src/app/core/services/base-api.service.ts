import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RETRY_CONFIG } from '../constants/api.constants';
import { PaginationParams } from '../models/pagination.model';
import { PaginationHelper } from '../helpers/pagination.helper';
import { ApiError, fromHttpError } from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;

  protected get<T>(endpoint: string, params?: PaginationParams | Record<string, unknown>): Observable<T> {
    const normalizedParams = params ? PaginationHelper.normalizeQueryParams(params) : undefined;
    return this.request<T>('GET', endpoint, undefined, normalizedParams);
  }

  protected post<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Observable<T> {
    return this.request<T>('POST', endpoint, body, undefined, headers);
  }

  protected put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  protected patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.request<T>('PATCH', endpoint, body);
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.request<T>('DELETE', endpoint);
  }

  private request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: PaginationParams | Record<string, unknown>,
    headers?: Record<string, string>,
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpParams = params ? PaginationHelper.toHttpParams(params) : undefined;

    let request$: Observable<T>;

    switch (method) {
      case 'GET':
        request$ = this.http.get<T>(url, { params: httpParams, withCredentials: true });
        break;
      case 'POST':
        request$ = this.http.post<T>(url, body, { params: httpParams, withCredentials: true, headers });
        break;
      case 'PUT':
        request$ = this.http.put<T>(url, body, { withCredentials: true });
        break;
      case 'PATCH':
        request$ = this.http.patch<T>(url, body, { withCredentials: true });
        break;
      case 'DELETE':
        request$ = this.http.delete<T>(url, { withCredentials: true });
        break;
      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }

    return request$.pipe(
      retry({
        count: RETRY_CONFIG.maxRetries,
        delay: (error: HttpErrorResponse, retryCount) => {
          if (!RETRY_CONFIG.retryableStatuses.includes(error.status as (typeof RETRY_CONFIG.retryableStatuses)[number])) {
            throw error;
          }
          return timer(RETRY_CONFIG.delayMs * retryCount);
        },
      }),
      catchError((error: HttpErrorResponse) => throwError(() => this.parseError(error))),
    );
  }

  protected parseError(error: HttpErrorResponse | ApiError): ApiError {
    if (error instanceof HttpErrorResponse) {
      return fromHttpError(error);
    }

    return {
      status: error.status,
      title: error.title || 'An unexpected error occurred',
      detail: error.detail,
      traceId: error.traceId,
      errorCode: error.errorCode,
      errors: error.errors,
    };
  }
}
