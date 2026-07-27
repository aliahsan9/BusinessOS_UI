import { StorageHelper } from '../helpers/storage.helper';
import { STORAGE_KEYS } from '../constants/storage.constants';
import {
  DEFAULT_THEME_PREFERENCES,
  ThemeExportPayload,
  ThemePreferences,
} from './theme.model';
import { THEME_LEGACY_KEY, migrateLegacyThemeMode } from './theme.constants';

export class ThemeStorage {
  /** Tenant-scoped key so one business's theme never overwrites another's. */
  static keyForTenant(tenantId?: string | null): string {
    const id = tenantId?.trim();
    return id ? `${STORAGE_KEYS.themePreferences}.${id}` : STORAGE_KEYS.themePreferences;
  }

  static load(tenantId?: string | null): ThemePreferences {
    const tenantKey = this.keyForTenant(tenantId);
    const stored = StorageHelper.get<ThemePreferences>(tenantKey);
    if (stored?.version === 1) {
      return { ...DEFAULT_THEME_PREFERENCES, ...stored };
    }

    // Migrate once from the legacy global key into the tenant bucket.
    if (tenantId?.trim()) {
      const legacyGlobal = StorageHelper.get<ThemePreferences>(STORAGE_KEYS.themePreferences);
      if (legacyGlobal?.version === 1) {
        StorageHelper.set(tenantKey, legacyGlobal);
        return { ...DEFAULT_THEME_PREFERENCES, ...legacyGlobal };
      }
    }

    const legacy = localStorage.getItem(THEME_LEGACY_KEY);
    if (legacy) {
      const migrated = migrateLegacyThemeMode(legacy);
      return { ...DEFAULT_THEME_PREFERENCES, ...migrated };
    }

    return { ...DEFAULT_THEME_PREFERENCES };
  }

  static save(preferences: ThemePreferences, tenantId?: string | null): void {
    StorageHelper.set(this.keyForTenant(tenantId), preferences);
  }

  static exportPreferences(preferences: ThemePreferences): ThemeExportPayload {
    return {
      exportedAt: new Date().toISOString(),
      preferences,
      customThemes: preferences.customThemes,
    };
  }

  static importPreferences(json: string): ThemePreferences {
    const parsed = JSON.parse(json) as ThemeExportPayload | ThemePreferences;
    if ('preferences' in parsed && parsed.preferences?.version === 1) {
      return { ...DEFAULT_THEME_PREFERENCES, ...parsed.preferences };
    }
    if ('version' in parsed && parsed.version === 1) {
      return { ...DEFAULT_THEME_PREFERENCES, ...parsed };
    }
    throw new Error('Invalid theme export file.');
  }

  static clear(tenantId?: string | null): void {
    StorageHelper.remove(this.keyForTenant(tenantId));
    if (!tenantId?.trim()) {
      StorageHelper.remove(STORAGE_KEYS.themePreferences);
    }
    localStorage.removeItem(THEME_LEGACY_KEY);
  }
}
