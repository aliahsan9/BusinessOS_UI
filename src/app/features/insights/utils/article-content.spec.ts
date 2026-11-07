import { ALL_INSIGHT_CATEGORIES, ArticleSummary } from '../models/article.model';
import {
  adjacentArticles,
  ArticleContentError,
  assignHeadingIds,
  calculateReadingTime,
  decorateMarkdown,
  extractToc,
  filterArticles,
  formatInsightDate,
  isValidSlug,
  parseArticleDocument,
  relatedArticles,
} from './article-content';

const SAMPLE = `---
title: Tenant filters
slug: tenant-filters
description: How a shared database keeps each company in its own rows.
category: SaaS Architecture
author: BusinessOS
publicationDate: 2026-10-18
updatedDate: 2026-11-02
featuredImage: assets/blog/tenant-filters/cover.svg
featuredImageAlt: Stacked tenant panels
tags:
  - multi-tenancy
  - ef-core
featured: true
---

Intro paragraph with enough words to count.

## Tenant isolation

Each company is a boundary.

### Query filters

EF Core can apply them.

\`\`\`csharp
## Not a heading
var ignored = true;
\`\`\`

## Tenant isolation
`;

describe('article content', () => {
  it('loads metadata from front matter', () => {
    const article = parseArticleDocument(SAMPLE, 'tenant-filters');

    expect(article.title).toBe('Tenant filters');
    expect(article.slug).toBe('tenant-filters');
    expect(article.category).toBe('SaaS Architecture');
    expect(article.author).toBe('BusinessOS');
    expect(article.publicationDate).toBe('2026-10-18');
    expect(article.updatedDate).toBe('2026-11-02');
    expect(article.tags).toEqual(['multi-tenancy', 'ef-core']);
    expect(article.featured).toBeTrue();
    expect(article.featuredImage).toBe('assets/blog/tenant-filters/cover.svg');
    expect(article.featuredImageAlt).toBe('Stacked tenant panels');
    expect(article.body.startsWith('Intro paragraph')).toBeTrue();
  });

  it('rejects a missing front matter block and a slug that does not match the folder', () => {
    expect(() => parseArticleDocument('No front matter', 'tenant-filters')).toThrowError(
      ArticleContentError,
      'Article is missing front matter.',
    );

    const mismatched = SAMPLE.replace('slug: tenant-filters', 'slug: other-article');
    expect(() => parseArticleDocument(mismatched, 'tenant-filters')).toThrowError(
      ArticleContentError,
      'Front matter slug does not match the article folder.',
    );
  });

  it('calculates reading time from prose and ignores fenced code', () => {
    expect(calculateReadingTime('word')).toBe(1);
    expect(calculateReadingTime(Array.from({ length: 200 }, () => 'word').join(' '))).toBe(1);
    expect(calculateReadingTime(Array.from({ length: 201 }, () => 'word').join(' '))).toBe(2);

    const padded = `${Array.from({ length: 200 }, () => 'word').join(' ')}\n\`\`\`\n${Array.from({ length: 500 }, () => 'code').join(' ')}\n\`\`\``;
    expect(calculateReadingTime(padded)).toBe(1);
  });

  it('uses an explicit reading time when front matter provides one', () => {
    const withTime = SAMPLE.replace('featured: true', 'featured: true\nreadingTime: 12');
    expect(parseArticleDocument(withTime, 'tenant-filters').readingTime).toBe(12);
  });

  it('builds a table of contents and skips headings inside code fences', () => {
    const toc = extractToc(SAMPLE);

    expect(toc.map((item) => item.text)).toEqual(['Tenant isolation', 'Query filters', 'Tenant isolation']);
    expect(toc.map((item) => item.level)).toEqual([2, 3, 2]);
    expect(toc.map((item) => item.id)).toEqual(['tenant-isolation', 'query-filters', 'tenant-isolation-2']);
    expect(toc.some((item) => item.text.includes('Not a heading'))).toBeFalse();
  });

  it('assigns those ids onto rendered headings', () => {
    const toc = extractToc(SAMPLE);
    const root = document.createElement('div');
    root.innerHTML = '<h2>Tenant isolation</h2><h3>Query filters</h3><h2>Tenant isolation</h2>';

    assignHeadingIds(root, toc);

    expect(root.querySelectorAll('h2')[0].id).toBe('tenant-isolation');
    expect(root.querySelector('h3')?.id).toBe('query-filters');
    expect(root.querySelectorAll('h2')[1].id).toBe('tenant-isolation-2');
  });

  it('opens external links safely and leaves article links in the same tab', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<a href="https://example.com/docs">Docs</a><a href="/insights/erp-security-reliability">Security</a><img src="cover.svg"><img src="diagram.svg" width="960" height="420" alt="Diagram">';

    decorateMarkdown(root);

    const external = root.querySelector('a[href^="https"]');
    const images = root.querySelectorAll('img');
    expect(external?.getAttribute('target')).toBe('_blank');
    expect(external?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(root.querySelector('a[href^="/insights"]')?.getAttribute('target')).toBeNull();
    expect(images[0]?.getAttribute('alt')).toBe('');
    expect(images[0]?.getAttribute('loading')).toBeNull();
    expect(images[1]?.getAttribute('loading')).toBe('lazy');
  });

  it('searches title, description, and tags, and filters by category', () => {
    const articles = sampleArticles();

    expect(filterArticles(articles, ALL_INSIGHT_CATEGORIES, 'vector').map((article) => article.slug)).toEqual([
      'ai-rag-business-software',
    ]);
    expect(filterArticles(articles, 'Security', '').map((article) => article.slug)).toEqual([
      'erp-security-reliability',
    ]);
    expect(filterArticles(articles, 'Security', 'inventory')).toEqual([]);
  });

  it('orders neighbors and prefers related articles from the same category', () => {
    const articles = sampleArticles();

    expect(adjacentArticles(articles, 'ai-rag-business-software')).toEqual({
      previous: articles[0],
      next: articles[2],
    });
    expect(relatedArticles(articles, 'ai-rag-business-software').map((article) => article.slug)).toEqual([
      'business-process-automation-ai',
      'erp-security-reliability',
      'modern-inventory-management',
    ]);
  });

  it('rejects invalid slugs and formats calendar dates without shifting the day', () => {
    expect(isValidSlug('modern-inventory-management')).toBeTrue();
    expect(isValidSlug('../etc/passwd')).toBeFalse();
    expect(isValidSlug('Has Spaces')).toBeFalse();
    expect(formatInsightDate('2026-10-18')).toBe('Oct 18, 2026');
  });
});

function sampleArticles(): ArticleSummary[] {
  return [
    summary('erp-security-reliability', 'Security', '2026-10-02', ['jwt']),
    summary('ai-rag-business-software', 'AI & Automation', '2026-09-16', ['vector', 'rag']),
    summary('business-process-automation-ai', 'AI & Automation', '2026-08-19', ['workflows']),
    summary('modern-inventory-management', 'Inventory & Operations', '2026-07-21', ['sku']),
  ];
}

function summary(slug: string, category: ArticleSummary['category'], publicationDate: string, tags: string[]): ArticleSummary {
  return {
    title: slug,
    slug,
    description: `${slug} description`,
    category,
    author: 'BusinessOS',
    publicationDate,
    updatedDate: publicationDate,
    readingTime: 8,
    featuredImage: `assets/blog/${slug}/cover.svg`,
    featuredImageAlt: slug,
    tags,
    featured: false,
  };
}
