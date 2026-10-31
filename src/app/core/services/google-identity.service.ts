import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential?: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline';
  size: 'large';
  text: 'continue_with';
  shape: 'rectangular';
  logo_alignment: 'left';
  width: number;
}

interface GoogleIdentityApi {
  initialize(config: GoogleIdConfiguration): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private scriptPromise: Promise<void> | null = null;
  private ready = false;

  get clientId(): string {
    return environment.googleClientId?.trim() ?? '';
  }

  get isConfigured(): boolean {
    return this.clientId.length > 0;
  }

  initialize(onCredential: (idToken: string) => void): Promise<void> {
    if (!this.isConfigured) {
      return Promise.resolve();
    }

    return this.loadScript().then(() => {
      const api = window.google?.accounts?.id;
      if (!api) {
        throw new Error('Google Identity Services did not load.');
      }

      api.initialize({
        client_id: this.clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });
      this.ready = true;
    });
  }

  renderButton(parent: HTMLElement): void {
    const api = window.google?.accounts?.id;
    if (!this.ready || !api) {
      return;
    }

    const width = Math.min(400, Math.max(240, Math.floor(parent.clientWidth || 360)));
    api.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width,
    });
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google sign-in failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['googleIdentity'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google sign-in failed to load.'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}
