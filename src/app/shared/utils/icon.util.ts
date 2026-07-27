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

/** Legacy emoji → Bootstrap Icons (Ask Sophia / quick actions migration). */
const EMOJI_TO_BI: Record<string, string> = {
  '📦': 'bi-box-seam',
  '⚠️': 'bi-exclamation-triangle',
  '📈': 'bi-graph-up-arrow',
  '🛒': 'bi-cart3',
  '👤': 'bi-person-plus',
  '💡': 'bi-lightbulb',
  '🔴': 'bi-exclamation-circle',
  '✨': 'bi-stars',
  '🧾': 'bi-receipt',
  '✅': 'bi-check2-square',
  '🤝': 'bi-person-plus',
  '📋': 'bi-clipboard-check',
  '📄': 'bi-file-earmark-text',
};

const CATEGORY_TO_BI: Record<string, string> = {
  inventory: 'bi-box-seam',
  sales: 'bi-graph-up-arrow',
  recommendations: 'bi-cart3',
  customers: 'bi-person-plus',
  churn: 'bi-people',
  finance: 'bi-cash-stack',
  orders: 'bi-bag-check',
  alerts: 'bi-exclamation-triangle',
};

/**
 * Resolve a display icon to a Bootstrap Icons class (`bi-…`).
 * Prefers explicit BI icons, then emoji maps, then category, then default.
 */
export function resolveBootstrapIcon(
  icon?: string | null,
  category?: string | null,
  fallback = 'bi-chat-dots',
): string {
  if (isBootstrapIcon(icon)) {
    const value = icon!.trim();
    return value.startsWith('bi ') ? value.slice(3) : value;
  }

  if (icon && EMOJI_TO_BI[icon.trim()]) {
    return EMOJI_TO_BI[icon.trim()];
  }

  const key = category?.trim().toLowerCase();
  if (key && CATEGORY_TO_BI[key]) {
    return CATEGORY_TO_BI[key];
  }

  return fallback;
}

/** Pick a Bootstrap icon for a free-text suggestion chip label. */
export function suggestionBootstrapIcon(label: string | null | undefined): string {
  const text = (label ?? '').toLowerCase();
  if (!text) return 'bi-chat-dots';
  if (/revenue|sales|trend|analytics|profit/.test(text)) return 'bi-graph-up-arrow';
  if (/invoice|bill|payment|overdue/.test(text)) return 'bi-receipt';
  if (/customer|client/.test(text)) return 'bi-people';
  if (/product|best.?sell|inventory|stock/.test(text)) return 'bi-box-seam';
  if (/task|todo|focus|today/.test(text)) return 'bi-check2-square';
  if (/order|purchase/.test(text)) return 'bi-bag-check';
  if (/tip|advice|increase|recommend/.test(text)) return 'bi-lightbulb';
  if (/workspace|ai /.test(text)) return 'bi-stars';
  return 'bi-chat-left-text';
}
