import { NAV_ITEMS } from '../constants/nav.constants';
import { ROUTES } from '../../core/constants/route.constants';

export interface GlobalSearchHit {
  id: string;
  kind: 'page' | 'records';
  label: string;
  description: string;
  icon: string;
  route: string;
  group: string;
  /** Passed to the destination list as `?search=` when this is a record search. */
  query?: string;
}

interface SearchPage {
  label: string;
  icon: string;
  route: string;
  description: string;
  permissions?: readonly string[];
  aliases: readonly string[];
}

interface RecordTarget {
  id: string;
  label: string;
  hint: string;
  icon: string;
  route: string;
  permissions?: readonly string[];
  aliases: readonly string[];
}

const STRONG_MATCH = 500;
const RESULT_LIMIT = 8;

const PAGE_ALIASES: Record<string, readonly string[]> = {
  [ROUTES.dashboard]: ['home', 'overview', 'start'],
  [ROUTES.products.base]: ['catalog', 'items', 'sku', 'goods'],
  [ROUTES.inventory.base]: ['inventory', 'warehouse', 'stock levels', 'on hand'],
  [ROUTES.suppliers.base]: ['vendors', 'vendor'],
  [ROUTES.purchaseOrders.base]: ['purchase orders', 'purchase order', 'po', 'purchasing'],
  [ROUTES.customers.base]: ['clients', 'client', 'buyers', 'contacts'],
  [ROUTES.orders.base]: ['sales orders', 'sales order'],
  [ROUTES.quotations.base]: ['quotations', 'quotation', 'estimates', 'estimate', 'proposals'],
  [ROUTES.invoices.base]: ['bills', 'bill'],
  [ROUTES.payments.base]: ['receipts', 'money received'],
  [ROUTES.sales.dashboard]: ['sales', 'revenue'],
  [ROUTES.reports]: ['reporting'],
  [ROUTES.analytics.base]: ['analytics', 'charts'],
  [ROUTES.finance.dashboard]: ['finance', 'money', 'cash'],
  [ROUTES.expenses.base]: ['spending', 'spend', 'costs'],
  [ROUTES.expenseCategories.base]: ['expense categories', 'expense category'],
  [ROUTES.finance.profitLoss]: ['pnl', 'p and l', 'profit and loss', 'profit loss'],
  [ROUTES.team.base]: ['members', 'staff'],
  [ROUTES.tenant.dashboard]: ['plan', 'usage'],
  [ROUTES.organization.base]: ['company', 'business profile'],
  [ROUTES.users.base]: ['accounts', 'people'],
  [ROUTES.roles.base]: ['access'],
  [ROUTES.permissions.base]: ['access rights'],
  [ROUTES.audit.base]: ['audit', 'trail'],
  [ROUTES.activity.base]: ['timeline'],
  [ROUTES.notifications.base]: ['alerts', 'bell'],
  [ROUTES.billing.base]: ['subscription'],
  [ROUTES.pricing.base]: ['plans', 'upgrade'],
  [ROUTES.settings.base]: ['preferences', 'configuration'],
  [ROUTES.admin.base]: ['admin', 'system'],
};

const EXTRA_PAGES: readonly SearchPage[] = [
  {
    label: 'Stock levels',
    icon: 'bi-box-seam',
    route: ROUTES.inventory.stockLevels,
    description: 'Quantities on hand for each product.',
    permissions: ['Inventory.View'],
    aliases: ['inventory levels', 'on hand', 'warehouse'],
  },
  {
    label: 'Stock history',
    icon: 'bi-clock-history',
    route: ROUTES.inventory.history,
    description: 'Stock movements and adjustments.',
    permissions: ['Inventory.View'],
    aliases: ['transactions', 'adjustments', 'inventory history'],
  },
  {
    label: 'Product categories',
    icon: 'bi-tags',
    route: ROUTES.products.categories.list,
    description: 'Groups in your product catalog.',
    permissions: ['Product.View'],
    aliases: ['categories', 'category', 'product groups'],
  },
  {
    label: 'Navla AI',
    icon: 'bi-stars',
    route: ROUTES.ai.workspace,
    description: 'Ask Navla about your business.',
    aliases: ['ai', 'assistant', 'copilot', 'chat'],
  },
  {
    label: 'Profile',
    icon: 'bi-person',
    route: ROUTES.profile,
    description: 'Your account profile.',
    aliases: ['account', 'my profile'],
  },
  {
    label: 'Appearance',
    icon: 'bi-palette',
    route: ROUTES.settings.appearance,
    description: 'Theme, colors, and layout.',
    aliases: ['theme', 'dark mode', 'light mode', 'dark'],
  },
];

const RECORD_TARGETS: readonly RecordTarget[] = [
  {
    id: 'products',
    label: 'Products',
    hint: 'name or SKU',
    icon: 'bi-box',
    route: ROUTES.products.list,
    permissions: ['Product.View'],
    aliases: ['product', 'sku', 'catalog', 'item'],
  },
  {
    id: 'customers',
    label: 'Customers',
    hint: 'name, email, or phone',
    icon: 'bi-person-badge',
    route: ROUTES.customers.list,
    permissions: ['Customer.View'],
    aliases: ['customer', 'client', 'buyer'],
  },
  {
    id: 'orders',
    label: 'Orders',
    hint: 'order number or customer',
    icon: 'bi-cart3',
    route: ROUTES.orders.list,
    permissions: ['Order.View'],
    aliases: ['order', 'sales order'],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    hint: 'invoice number or customer',
    icon: 'bi-receipt',
    route: ROUTES.invoices.list,
    permissions: ['Invoice.View'],
    aliases: ['invoice', 'bill'],
  },
  {
    id: 'quotes',
    label: 'Quotes',
    hint: 'quote number or customer',
    icon: 'bi-file-earmark-text',
    route: ROUTES.quotations.list,
    permissions: ['Quotation.View'],
    aliases: ['quote', 'quotation', 'estimate'],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    hint: 'name, email, or phone',
    icon: 'bi-truck',
    route: ROUTES.suppliers.list,
    permissions: ['Supplier.View'],
    aliases: ['supplier', 'vendor'],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    hint: 'description or vendor',
    icon: 'bi-graph-up-arrow',
    route: ROUTES.expenses.list,
    permissions: ['Expense.View'],
    aliases: ['expense', 'spend', 'cost'],
  },
  {
    id: 'users',
    label: 'Users',
    hint: 'name or email',
    icon: 'bi-people',
    route: ROUTES.users.list,
    permissions: ['User.View'],
    aliases: ['user', 'account'],
  },
  {
    id: 'team',
    label: 'Team',
    hint: 'member name',
    icon: 'bi-people',
    route: ROUTES.team.list,
    permissions: ['Team.View'],
    aliases: ['team', 'member', 'staff'],
  },
  {
    id: 'stock',
    label: 'Stock',
    hint: 'product name or SKU',
    icon: 'bi-box-seam',
    route: ROUTES.inventory.stockLevels,
    permissions: ['Inventory.View'],
    aliases: ['stock', 'inventory', 'sku'],
  },
  {
    id: 'categories',
    label: 'Product categories',
    hint: 'category name',
    icon: 'bi-tags',
    route: ROUTES.products.categories.list,
    permissions: ['Product.View'],
    aliases: ['category', 'categories'],
  },
];

const SUGGESTED_ROUTES = [
  ROUTES.dashboard,
  ROUTES.products.list,
  ROUTES.customers.list,
  ROUTES.orders.list,
  ROUTES.invoices.list,
  ROUTES.inventory.stockLevels,
  ROUTES.expenses.list,
  ROUTES.reports,
  ROUTES.settings.hub,
] as const;

const DEFAULT_RECORD_IDS = ['products', 'customers', 'orders', 'invoices'] as const;

const PAGES: readonly SearchPage[] = [
  ...NAV_ITEMS.map((item) => ({
    label: item.label,
    icon: item.icon,
    route: item.route,
    description: item.description,
    permissions: item.permissions,
    aliases: PAGE_ALIASES[item.route] ?? [],
  })),
  ...EXTRA_PAGES,
];

export function buildGlobalSearchResults(
  query: string,
  canAccess: (permissions?: readonly string[]) => boolean,
): GlobalSearchHit[] {
  const pages = PAGES.filter((page) => canAccess(page.permissions));
  const records = RECORD_TARGETS.filter((record) => canAccess(record.permissions));
  const q = query.trim();

  if (!q) {
    const suggested: GlobalSearchHit[] = [];
    for (const route of SUGGESTED_ROUTES) {
      const page = pages.find((item) => item.route === route);
      if (!page) continue;
      suggested.push(toPageHit(page, 'Go to'));
      if (suggested.length >= 6) break;
    }
    return suggested;
  }

  const pageHits = pages
    .map((page) => ({
      page,
      score: scoreText(q, [page.label, page.description, ...page.aliases]),
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.page.label.localeCompare(b.page.label));

  const recordMatches = records
    .map((record) => ({ record, ...scoreRecord(q, record) }))
    .filter((hit) => hit.score >= STRONG_MATCH && hit.searchText.length > 0)
    .sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label));

  const pagesAreSpecific = (pageHits[0]?.score ?? 0) >= STRONG_MATCH;
  const recordHits = (
    recordMatches.length
      ? recordMatches.slice(0, 4)
      : q.length >= 2 && !pagesAreSpecific
        ? defaultRecords(records, q)
        : []
  ).map((hit) => toRecordHit(hit.record, hit.searchText));

  const pageSlice = pageHits.slice(0, 6).map((hit) => toPageHit(hit.page, 'Pages'));
  const ordered = pagesAreSpecific ? [...pageSlice, ...recordHits] : [...recordHits, ...pageSlice];

  const seen = new Set<string>();
  const results: GlobalSearchHit[] = [];
  for (const hit of ordered) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    results.push(hit);
    if (results.length >= RESULT_LIMIT) break;
  }
  return results;
}

function defaultRecords(records: readonly RecordTarget[], query: string): { record: RecordTarget; searchText: string }[] {
  const preferred = DEFAULT_RECORD_IDS
    .map((id) => records.find((record) => record.id === id))
    .filter((record): record is RecordTarget => !!record);
  const chosen = (preferred.length ? preferred : records).slice(0, 4);
  return chosen.map((record) => ({ record, searchText: query }));
}

function toPageHit(page: SearchPage, group: string): GlobalSearchHit {
  return {
    id: `page:${page.route}`,
    kind: 'page',
    label: page.label,
    description: page.description,
    icon: page.icon,
    route: page.route,
    group,
  };
}

function toRecordHit(record: RecordTarget, searchText: string): GlobalSearchHit {
  return {
    id: `records:${record.id}`,
    kind: 'records',
    label: `Search ${record.label}`,
    description: `Find ${record.hint} matching "${searchText}"`,
    icon: record.icon,
    route: record.route,
    group: 'Records',
    query: searchText,
  };
}

function scoreRecord(query: string, record: RecordTarget): { score: number; searchText: string } {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  let best = 0;
  let bestIndex = -1;
  tokens.forEach((token, index) => {
    const score = scoreText(token, [record.label, ...record.aliases]);
    if (score > best) {
      best = score;
      bestIndex = index;
    }
  });
  const searchText =
    best >= STRONG_MATCH && bestIndex >= 0
      ? tokens.filter((_, index) => index !== bestIndex).join(' ')
      : query.trim();
  return { score: best, searchText };
}

function scoreText(query: string, fields: readonly string[]): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const haystacks = fields.map(normalize).filter(Boolean);
  if (!haystacks.length || !tokens.length) return 0;

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of haystacks) {
      best = Math.max(best, scoreToken(token, field));
    }
    if (best <= 0) return 0;
    total += best;
  }

  let phrase = 0;
  for (const field of haystacks) {
    phrase = Math.max(phrase, scoreToken(normalizedQuery, field));
  }
  return Math.max(phrase + (tokens.length > 1 ? 40 : 0), total);
}

function scoreToken(token: string, field: string): number {
  if (field === token) return 1000;
  if (field.startsWith(token)) return 860;
  const words = field.split(' ');
  if (words.some((word) => word === token)) return 940;
  if (words.some((word) => word.startsWith(token))) return 800;
  if (field.includes(token)) return 700;

  let best = 0;
  for (const candidate of words.length > 1 ? [field, ...words] : [field]) {
    best = Math.max(best, typoScore(token, candidate));
  }
  return best;
}

function typoScore(token: string, candidate: string): number {
  if (token.length < 4 || Math.abs(token.length - candidate.length) > 3) return 0;
  if (token[0] !== candidate[0]) return 0;
  const distance = levenshtein(token, candidate);
  if (distance === 0) return 0;
  const max = token.length >= 5 ? 2 : 1;
  const prefix = sharedPrefix(token, candidate);
  const allowed = distance <= max || (prefix >= 3 && distance <= max + 1);
  if (!allowed) return 0;
  return 760 - distance * 70;
}

function sharedPrefix(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index += 1;
  return index;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let column = 0; column <= b.length; column += 1) previous[column] = column;

  for (let row = 1; row <= a.length; row += 1) {
    current[0] = row;
    const leftChar = a.charCodeAt(row - 1);
    for (let column = 1; column <= b.length; column += 1) {
      const cost = leftChar === b.charCodeAt(column - 1) ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
    }
    for (let column = 0; column <= b.length; column += 1) previous[column] = current[column];
  }

  return previous[b.length];
}
