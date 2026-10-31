import { Injectable, inject } from '@angular/core';
import { TokenService } from './token.service';

/**
 * Hint-only cache of the active conversation id (sessionStorage).
 * SQL Server remains the source of truth; callers must validate via the API.
 */
@Injectable({ providedIn: 'root' })
export class AiConversationSessionStore {
  private readonly tokens = inject(TokenService);
  private memoryId: string | null = null;

  get(): string | null {
    if (this.memoryId) {
      return this.memoryId;
    }

    try {
      const stored = sessionStorage.getItem(this.key());
      this.memoryId = stored || null;
      return this.memoryId;
    } catch {
      return this.memoryId;
    }
  }

  set(id: string | null): void {
    this.memoryId = id;
    try {
      const key = this.key();
      if (id) {
        sessionStorage.setItem(key, id);
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      /* ignore quota / private mode */
    }
  }

  clear(): void {
    this.set(null);
  }

  private key(): string {
    const tenant = this.tokens.tenantId() ?? 'none';
    const user = this.tokens.getUser()?.userId ?? 'anon';
    return `businessos.ai.activeConversation.${tenant}.${user}`;
  }
}
