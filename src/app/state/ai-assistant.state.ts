import { Injectable, computed, inject, signal } from '@angular/core';
import { TenantSettingsStoreService } from '../core/services/tenant-settings-store.service';

@Injectable({ providedIn: 'root' })
export class AiAssistantStateService {
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);

  private readonly _isOpen = signal(false);
  private readonly _pendingPrompt = signal<string | null>(null);

  readonly isOpen = this._isOpen.asReadonly();
  readonly pendingPrompt = this._pendingPrompt.asReadonly();
  readonly chatEnabled = computed(
    () => this.tenantSettingsStore.settings()?.aiAssistantEnabled ?? true,
  );

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update((open) => !open);
  }

  /** Open Sophia and queue a prompt to send once the chat window is ready. */
  askSophia(message: string): void {
    const trimmed = message.trim();
    if (!trimmed) {
      this.open();
      return;
    }
    this._pendingPrompt.set(trimmed);
    this._isOpen.set(true);
  }

  consumePendingPrompt(): string | null {
    const value = this._pendingPrompt();
    this._pendingPrompt.set(null);
    return value;
  }
}
