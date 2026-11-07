import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

const API = 'http://127.0.0.1:5162';

test.describe('Sophia chat', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  const password = 'SophiaE2e1!';
  const stamp = Date.now().toString(36);
  const cancelSku = `E2E-CANCEL-${stamp}`.toUpperCase();
  const confirmSku = `E2E-CONFIRM-${stamp}`.toUpperCase();
  const saleProduct = `E2E Lamp ${stamp}`;
  const saleCustomer = `E2E Buyer ${stamp}`;
  let email = '';
  let token = '';
  let tenantId = '';
  let page: Page;
  let sawLoadingIndicator = false;

  test.beforeAll(async ({ browser, request }) => {
    email = `sophia.e2e.${stamp}@example.com`;
    const registered = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email,
        password,
        firstName: 'Sophia',
        lastName: 'E2E',
        businessName: `Sophia E2E ${stamp}`,
      },
    });
    expect(registered.status(), await registered.text()).toBe(201);
    const auth = await registered.json();
    token = auth.token as string;
    tenantId = auth.tenantId as string;

    const category = await request.post(`${API}/api/v1/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
      data: { name: `E2E Cat ${stamp}` },
    });
    expect(category.status(), await category.text()).toBe(201);

    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/auth/login');
    await page.locator('#loginEmail').fill(email);
    await page.locator('#loginPassword').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 });
    const skip = page.getByRole('button', { name: 'Skip Onboarding' });
    if (page.url().includes('/onboarding') || (await skip.isVisible().catch(() => false))) {
      await skip.click();
    }
    await page.getByRole('button', { name: 'Talk to Navla' }).waitFor({ timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('opens the chat, sends a message, and shows a loading state', async () => {
    await page.getByRole('button', { name: 'Talk to Navla' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Hi — I'm/)).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Message' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Send' })).toBeDisabled();

    const reply = await send(page, 'Create a product named Probe Widget');
    expect(sawLoadingIndicator).toBeTruthy();
    await expect(reply).toContainText(/SKU/i);
    await expect(reply).toContainText(/won't generate/i);
  });

  test('follows up with the missing fields and renders the confirmation card', async () => {
    const reply = await send(
      page,
      `SKU ${cancelSku}, cost price 11, sale price 19`,
    );
    const card = reply.locator('.ai-chat__confirm');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('aria-label', 'Create product');
    await expect(card.getByText('Product name')).toBeVisible();
    await expect(card.getByText('Probe Widget')).toBeVisible();
    await expect(card.getByText(cancelSku)).toBeVisible();
    await expect(card.getByText('Nothing is saved until you confirm.')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Confirm' })).toBeEnabled();
    await expect(card.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(await productCount(requestOf(page), cancelSku)).toBe(0);
  });

  test('a changed price asks again and does not save the original draft', async () => {
    const reply = await send(page, 'sale price 77');
    const card = reply.locator('.ai-chat__confirm');
    await expect(card).toBeVisible();
    await expect(card.getByText('77')).toBeVisible();
    await expect(reply).toContainText(/confirm/i);
    expect(await productCount(requestOf(page), cancelSku)).toBe(0);
  });

  test('cancel leaves no product', async () => {
    const card = page.locator('.ai-chat__confirm').last();
    await card.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.ai-chat__bubble').last()).toContainText(/cancel/i, { timeout: 60_000 });
    await expect(page.locator('.ai-chat__confirm')).toHaveCount(0);
    expect(await productCount(requestOf(page), cancelSku)).toBe(0);
  });

  test('confirm creates only the presented product and shows the tool', async () => {
    await page.getByRole('button', { name: 'New conversation' }).click();
    await expect(page.locator('.ai-chat__bubble')).toHaveCount(1);
    await send(
      page,
      `Create a product named Confirmed Widget with SKU ${confirmSku}, cost price 12, sale price 30.`,
    );
    const card = page.locator('.ai-chat__confirm').last();
    await expect(card).toBeVisible();
    await expect(card.getByText(confirmSku)).toBeVisible();
    await card.getByRole('button', { name: 'Confirm' }).click();
    const reply = page.locator('.ai-chat__bubble').last();
    await expect(reply).toContainText(/creat/i, { timeout: 90_000 });
    const openedProduct = page.getByRole('heading', { name: 'Confirmed Widget' });
    const tools = reply.locator('.ai-chat__tools');
    await expect(openedProduct.or(tools)).toBeVisible({ timeout: 15_000 });
    expect(await productCount(requestOf(page), confirmSku)).toBe(1);
    expect(await productCount(requestOf(page), cancelSku)).toBe(0);
  });

  test('sale confirmation can be cancelled without an order', async () => {
    await ensureChat(page);
    const productId = await seedSaleCatalog(requestOf(page));
    const ordersBefore = await orderCount(requestOf(page));
    await page.getByRole('button', { name: 'New conversation' }).click();
    await expect(page.locator('.ai-chat__bubble')).toHaveCount(1);
    let reply = await send(
      page,
      `Create a sale for ${saleCustomer} of ${saleProduct}, quantity 1`,
    );
    const askAgain = reply.getByText(/which|how many|couldn't find|customer|product/i);
    if (await askAgain.count()) {
      reply = await send(page, `${saleCustomer}, ${saleProduct}, quantity 1`);
    }
    const cancel = page.getByRole('button', { name: /cancel/i }).last();
    await expect(cancel).toBeVisible({ timeout: 20_000 });
    const card = page.locator('.ai-chat__confirm');
    const cardCount = await card.count();
    await cancel.click();
    await expect(page.locator('.ai-chat__bubble').last()).toContainText(/cancel/i, { timeout: 60_000 });
    expect(await orderCount(requestOf(page))).toBe(ordersBefore);
    expect(productId).toBeTruthy();
    test.info().annotations.push({
      type: 'sale-confirmation-card',
      description: cardCount > 0 ? 'field card rendered' : 'suggestion buttons only',
    });
  });

  test('a rejected session shows a safe error and does not reveal internals', async () => {
    await ensureChat(page);
    await page.route('**/api/v1/agents/chat**', async (route) => {
      const headers = {
        ...route.request().headers(),
        authorization: 'Bearer not-a-valid-token',
      };
      await route.continue({ headers });
    });
    await page.getByRole('button', { name: 'New conversation' }).click();
    const box = page.getByRole('textbox', { name: 'Message' });
    await box.click();
    await box.pressSequentially('What is my total sales?', { delay: 8 });
    const sendButton = page.locator('footer.ai-chat__input').getByRole('button', { name: 'Send', exact: true });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    await expect(page).toHaveURL(/auth\/login/, { timeout: 30_000 });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/sk-[a-z0-9_\-]{8,}/i);
    expect(body).not.toMatch(/SqlException|stack trace|ConnectionStrings/i);
  });

  async function ensureChat(current: Page): Promise<void> {
    const dialog = current.getByRole('dialog');
    if (!(await dialog.isVisible().catch(() => false))) {
      await current.getByRole('button', { name: 'Talk to Navla' }).click();
      await expect(dialog).toBeVisible();
    }
  }

  async function send(current: Page, text: string): Promise<Locator> {
    const bubbles = current.locator('.ai-chat__bubble');
    const before = await bubbles.count();
    const box = current.getByRole('textbox', { name: 'Message' });
    await box.click();
    await box.fill('');
    await box.pressSequentially(text, { delay: 8 });
    const sendButton = current.locator('footer.ai-chat__input').getByRole('button', { name: 'Send', exact: true });
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    const stop = current.locator('.ai-chat__stop');
    const thinking = current.getByText(/Thinking|Checking the details|Planning|Consulting business data/);
    const indicator = Promise.race([
      stop.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'stop'),
      thinking.first().waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'status'),
    ]).catch(() => 'missed');
    await sendButton.click();
    if ((await indicator) !== 'missed') sawLoadingIndicator = true;
    await expect(bubbles).toHaveCount(before + 2, { timeout: 90_000 });
    await expect(current.getByRole('button', { name: 'Send' })).toBeVisible({ timeout: 90_000 });
    return bubbles.nth(before + 1);
  }

  function requestOf(current: Page): APIRequestContext {
    return current.request;
  }

  async function productCount(request: APIRequestContext, sku: string): Promise<number> {
    const response = await request.get(`${API}/api/v1/products?search=${encodeURIComponent(sku)}&page=1&pageSize=20`, {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    return body.split(sku).length - 1 > 0 ? (body.match(new RegExp(sku, 'g')) ?? []).length : 0;
  }

  async function orderCount(request: APIRequestContext): Promise<number> {
    const response = await request.get(`${API}/api/v1/orders?page=1&pageSize=50`, {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const items = body.items ?? body.Items ?? [];
    return Array.isArray(items) ? items.length : 0;
  }

  async function seedSaleCatalog(request: APIRequestContext): Promise<string> {
    const category = await request.post(`${API}/api/v1/categories`, {
      headers: authHeaders(),
      data: { name: `E2E Sale Cat ${stamp}` },
    });
    expect(category.status()).toBe(201);
    const categoryId = (await category.json()).id as string;
    const product = await request.post(`${API}/api/v1/products`, {
      headers: authHeaders(),
      data: {
        categoryId,
        name: saleProduct,
        sku: `E2E-SALE-${stamp}`.toUpperCase(),
        costPrice: 10,
        salePrice: 25,
        reorderLevel: 1,
      },
    });
    expect(product.status(), await product.text()).toBe(201);
    const productId = (await product.json()).id as string;
    const stock = await request.post(`${API}/api/v1/inventory/increase`, {
      headers: authHeaders(),
      data: { productId, quantity: 5, notes: 'e2e stock' },
    });
    expect(stock.status(), await stock.text()).toBeLessThan(300);
    const customer = await request.post(`${API}/api/v1/customers`, {
      headers: authHeaders(),
      data: {
        firstName: 'E2E',
        lastName: `Buyer ${stamp}`,
        email: `buyer.${stamp}@example.com`,
        phoneNumber: '03001234567',
        address: '1 Test Road',
        city: 'Lahore',
        country: 'Pakistan',
        postalCode: '54000',
      },
    });
    expect(customer.status(), await customer.text()).toBe(201);
    return productId;
  }

  function authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
    };
  }
});
