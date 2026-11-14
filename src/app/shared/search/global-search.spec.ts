import { buildGlobalSearchResults } from './global-search';
import { ROUTES } from '../../core/constants/route.constants';

const ALL_ACCESS = () => true;
const NO_PERMISSIONS = (permissions?: readonly string[]) => !permissions?.length;

describe('buildGlobalSearchResults', () => {
  it('suggests common pages before the user types', () => {
    const hits = buildGlobalSearchResults('', ALL_ACCESS);
    expect(hits.map((hit) => hit.label)).toEqual([
      'Dashboard',
      'Products',
      'Customers',
      'Orders',
      'Invoices',
      'Stock levels',
    ]);
    expect(hits.every((hit) => hit.kind === 'page' && hit.group === 'Go to')).toBeTrue();
  });

  it('finds a page from a partial name, a typo, and an alias', () => {
    const invoices = buildGlobalSearchResults('inv', ALL_ACCESS);
    expect(invoices[0]?.label).toBe('Invoices');

    const typo = buildGlobalSearchResults('invioce', ALL_ACCESS);
    expect(typo.some((hit) => hit.route === ROUTES.invoices.list && hit.kind === 'page')).toBeTrue();

    const purchaseOrder = buildGlobalSearchResults('po', ALL_ACCESS);
    expect(purchaseOrder[0]?.route).toBe(ROUTES.purchaseOrders.list);
  });

  it('searches records for a name that is not a page', () => {
    const hits = buildGlobalSearchResults('acme', ALL_ACCESS);
    expect(hits.slice(0, 4).map((hit) => hit.label)).toEqual([
      'Search Products',
      'Search Customers',
      'Search Orders',
      'Search Invoices',
    ]);
    expect(hits[0]).toEqual(
      jasmine.objectContaining({ kind: 'records', route: ROUTES.products.list, query: 'acme' }),
    );
  });

  it('keeps the record text and drops the list name', () => {
    const hits = buildGlobalSearchResults('invoice 1042', ALL_ACCESS);
    const invoiceSearch = hits.find((hit) => hit.id === 'records:invoices');
    expect(invoiceSearch).toEqual(
      jasmine.objectContaining({ kind: 'records', query: '1042', route: ROUTES.invoices.list }),
    );
  });

  it('offers both the orders page and a customer lookup for "customer order"', () => {
    const hits = buildGlobalSearchResults('customer order', ALL_ACCESS);
    expect(hits.some((hit) => hit.kind === 'page' && hit.route === ROUTES.orders.list)).toBeTrue();
    expect(hits.some((hit) => hit.id === 'records:customers' && hit.query === 'order')).toBeTrue();
    expect(hits.some((hit) => hit.id === 'records:orders' && hit.query === 'customer')).toBeTrue();
  });

  it('hides pages and records the user cannot open', () => {
    const hits = buildGlobalSearchResults('invoices', NO_PERMISSIONS);
    expect(hits.some((hit) => hit.route === ROUTES.invoices.list)).toBeFalse();

    const suggested = buildGlobalSearchResults('', NO_PERMISSIONS);
    expect(suggested.some((hit) => hit.label === 'Dashboard')).toBeTrue();
    expect(suggested.some((hit) => hit.label === 'Invoices')).toBeFalse();
  });

  it('finds appearance from "dark mode"', () => {
    const hits = buildGlobalSearchResults('dark mode', ALL_ACCESS);
    expect(hits[0]?.route).toBe(ROUTES.settings.appearance);
  });
});
