export const environment = {
  production: false,
  apiUrl: '/api/v1',
  appName: 'BusinessOS',
  tokenRefreshBufferMs: 60_000,
  defaultPageSize: 20,
  maxPageSize: 100,
  devCredentials: undefined as { email: string; password: string } | undefined,
  /** When the speech API fails in development, read the reply with the browser voice. */
  browserSpeechFallback: true,
  /**
   * Public Google OAuth client ID (not a secret). Leave empty until Google Cloud Console is configured.
   * Must match the API setting Google:ClientId.
   */
  googleClientId: '',
};
