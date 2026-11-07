import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { calculateReadingTime } from '../utils/article-content';
import { InsightsService } from './insights.service';

const MARKDOWN = `---
title: Modern Inventory Management Systems
slug: modern-inventory-management
description: SKUs, movements, and reservations.
category: Inventory & Operations
author: BusinessOS
publicationDate: 2026-07-21
updatedDate: 2026-09-30
featuredImage: assets/blog/modern-inventory-management/cover.svg
featuredImageAlt: Stock bars
tags:
  - inventory
  - sku
featured: false
---

## Stock movements

A receipt increases on hand.

### Reservations

Reserve and ship in one transaction.
`;

describe('InsightsService', () => {
  let service: InsightsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InsightsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads article metadata and markdown, then reuses the parsed article', () => {
    let firstTitle = '';
    service.getArticle('modern-inventory-management').subscribe((article) => {
      firstTitle = article?.title ?? '';
    });

    const request = http.expectOne('assets/blog/modern-inventory-management/article.md');
    expect(request.request.headers.get('X-Skip-Loading')).toBe('1');
    expect(request.request.responseType).toBe('text');
    request.flush(MARKDOWN);

    expect(firstTitle).toBe('Modern Inventory Management Systems');

    let secondBody = '';
    let secondReadingTime = 0;
    service.getArticle('modern-inventory-management').subscribe((article) => {
      secondBody = article?.body ?? '';
      secondReadingTime = article?.readingTime ?? 0;
    });

    http.expectNone('assets/blog/modern-inventory-management/article.md');
    expect(secondBody).toContain('## Stock movements');
    expect(secondReadingTime).toBe(calculateReadingTime(secondBody));
    expect(secondBody).not.toContain('slug:');
  });

  it('does not request a file for an invalid slug', () => {
    let result: unknown = 'pending';
    service.getArticle('../etc/passwd').subscribe((article) => {
      result = article;
    });

    expect(result).toBeNull();
    http.expectNone(() => true);
  });

  it('returns null when the markdown file is missing', () => {
    let result: unknown = 'pending';
    service.getArticle('missing-article').subscribe((article) => {
      result = article;
    });

    const request = http.expectOne('assets/blog/missing-article/article.md');
    request.flush('missing', { status: 404, statusText: 'Not Found' });
    expect(result).toBeNull();
  });

  it('loads the catalog from the index and ignores unsafe slugs', () => {
    let titles: string[] = [];
    service.getArticles().subscribe((articles) => {
      titles = articles.map((article) => article.title);
    });

    http.expectOne('assets/blog/index.json').flush({
      articles: ['modern-inventory-management', 'Not A Slug', '../secrets'],
    });
    http.expectOne('assets/blog/modern-inventory-management/article.md').flush(MARKDOWN);

    expect(titles).toEqual(['Modern Inventory Management Systems']);

    let secondLoad = 0;
    service.getArticles().subscribe((articles) => {
      secondLoad = articles.length;
    });
    http.expectNone('assets/blog/index.json');
    expect(secondLoad).toBe(1);
  });
});
