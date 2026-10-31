export const environment = {
  production: true,
  apiUrl: '/api/v1',
  appName: 'BusinessOS',
  tokenRefreshBufferMs: 60_000,
  defaultPageSize: 20,
  maxPageSize: 100,
  devCredentials: undefined as { email: string; password: string } | undefined,
  browserSpeechFallback: false,
  /** Public Google OAuth client ID. Not a secret. Must match the API Google:ClientId. */
  googleClientId: '',
};
