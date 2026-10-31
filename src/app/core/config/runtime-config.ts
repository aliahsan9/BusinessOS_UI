import { environment } from '../../../environments/environment';

export interface PublicAppConfig {
  apiUrl: string;
  googleClientId: string;
  environmentName: string;
}

const allowedKeys = new Set(['apiUrl', 'googleClientId', 'environmentName']);

/**
 * Loads the public runtime file before Angular creates services.
 * The file may contain only browser-safe values. Database credentials,
 * JWT signing keys, and provider secrets are rejected.
 */
export async function loadRuntimeConfig(): Promise<PublicAppConfig> {
  let response: Response;
  try {
    response = await fetch('/app-config.json', { cache: 'no-store' });
  } catch {
    throw new Error(
      'BusinessOS could not load /app-config.json. The frontend has no API address.',
    );
  }

  if (!response.ok) {
    throw new Error(
      `BusinessOS could not load /app-config.json (HTTP ${response.status}).`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('BusinessOS /app-config.json is not valid JSON.');
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('BusinessOS /app-config.json must be a JSON object.');
  }

  const record = payload as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key) || /secret|password|token|apikey|api_key|connection/i.test(key)) {
      throw new Error(
        `BusinessOS /app-config.json contains a setting that is not public (${key}).`,
      );
    }
  }

  const apiUrl = readString(record, 'apiUrl');
  if (!apiUrl) {
    throw new Error(
      'BusinessOS /app-config.json is missing apiUrl. Use a relative path such as /api/v1.',
    );
  }

  if (!isSafeApiUrl(apiUrl)) {
    throw new Error(
      'BusinessOS /app-config.json apiUrl must be a relative path or an http(s) URL.',
    );
  }

  const environmentName = readString(record, 'environmentName') || 'local';
  if (
    (environmentName === 'staging' || environmentName === 'prod-local') &&
    /localhost:5162|localhost:4200|127\.0\.0\.1:5162|127\.0\.0\.1:4200/i.test(apiUrl)
  ) {
    throw new Error(
      'This frontend environment must not call the development API.',
    );
  }

  const googleClientId = readString(record, 'googleClientId');
  environment.apiUrl = apiUrl.replace(/\/+$/, '');
  environment.googleClientId = googleClientId;

  return {
    apiUrl: environment.apiUrl,
    googleClientId,
    environmentName,
  };
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isSafeApiUrl(apiUrl: string): boolean {
  if (apiUrl.startsWith('/') && !apiUrl.startsWith('//')) {
    return true;
  }

  try {
    const url = new URL(apiUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
