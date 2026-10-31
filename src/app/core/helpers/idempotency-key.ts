const STORAGE_PREFIX = 'businessos.idempotency.';

export function idempotencyKeyFor(scope: string, payload: unknown): string {
  const fingerprint = stableFingerprint(payload);
  const storageKey = `${STORAGE_PREFIX}${scope}`;
  const existing = read(storageKey);
  if (existing?.fingerprint === fingerprint) {
    return existing.key;
  }

  const key = crypto.randomUUID();
  write(storageKey, { fingerprint, key });
  return key;
}

function stableFingerprint(payload: unknown): string {
  return JSON.stringify(sortValue(payload));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortValue((value as Record<string, unknown>)[key]);
        return sorted;
      }, {});
  }

  return value;
}

function read(storageKey: string): { fingerprint: string; key: string } | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { fingerprint?: string; key?: string };
    if (!parsed.fingerprint || !parsed.key) return null;
    return { fingerprint: parsed.fingerprint, key: parsed.key };
  } catch {
    return null;
  }
}

function write(storageKey: string, value: { fingerprint: string; key: string }): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // The in-memory key for this call is still returned to the request.
  }
}
