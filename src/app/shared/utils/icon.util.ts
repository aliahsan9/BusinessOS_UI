/** True when the value is a Bootstrap Icons class (e.g. `bi-bell` or `bi bi-bell`). */
export function isBootstrapIcon(icon: string | null | undefined): boolean {
  if (!icon) return false;
  const value = icon.trim();
  return value.startsWith('bi-') || value.startsWith('bi ');
}

/** Normalize to a class list usable on `<i class="bi …">`. */
export function bootstrapIconClass(icon: string | null | undefined): string {
  if (!icon) return '';
  const value = icon.trim();
  if (value.startsWith('bi ')) return value;
  if (value.startsWith('bi-')) return value;
  return '';
}
