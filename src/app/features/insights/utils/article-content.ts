import {
  ALL_INSIGHT_CATEGORIES,
  Article,
  ArticleSummary,
  INSIGHT_CATEGORIES,
  InsightCategory,
  TocItem,
} from '../models/article.model';

const WORDS_PER_MINUTE = 200;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONT_MATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export class ArticleContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArticleContentError';
  }
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function formatInsightDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function slugifyHeading(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return slug || 'section';
}

export function calculateReadingTime(markdown: string, wordsPerMinute = WORDS_PER_MINUTE): number {
  const plain = stripFencedCode(markdown)
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]/g, ' ');
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function extractToc(markdown: string): TocItem[] {
  const counts = new Map<string, number>();
  const items: TocItem[] = [];

  for (const line of stripFencedCode(markdown).split(/\r?\n/)) {
    const match = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length as 2 | 3 | 4;
    const text = cleanHeadingText(match[2]);
    if (!text) {
      continue;
    }

    const base = slugifyHeading(text);
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    items.push({
      id: seen === 0 ? base : `${base}-${seen + 1}`,
      text,
      level,
    });
  }

  return items;
}

export function parseArticleDocument(raw: string, expectedSlug: string): Article {
  if (!isValidSlug(expectedSlug)) {
    throw new ArticleContentError('Invalid article slug.');
  }

  const { data, body } = splitFrontMatter(raw);
  const slug = requiredString(data, 'slug');
  if (slug !== expectedSlug) {
    throw new ArticleContentError('Front matter slug does not match the article folder.');
  }

  const title = requiredString(data, 'title');
  const description = requiredString(data, 'description');
  const category = requiredCategory(data);
  const author = requiredString(data, 'author');
  const publicationDate = requiredDate(data, 'publicationDate');
  const updatedDate = data['updatedDate'] === undefined
    ? publicationDate
    : requiredDate(data, 'updatedDate');
  const featuredImage = normalizeAssetPath(requiredString(data, 'featuredImage'));
  const featuredImageAlt = optionalString(data, 'featuredImageAlt') || title;
  const tags = requiredTags(data);
  const featured = requiredBoolean(data, 'featured', false);
  const readingTime = data['readingTime'] === undefined
    ? calculateReadingTime(body)
    : requiredReadingTime(data['readingTime']);

  return {
    title,
    slug,
    description,
    category,
    author,
    publicationDate,
    updatedDate,
    readingTime,
    featuredImage,
    featuredImageAlt,
    tags,
    featured,
    body,
    toc: extractToc(body),
  };
}

export function sortArticles<T extends ArticleSummary>(articles: readonly T[]): T[] {
  return [...articles].sort((left, right) => {
    const byDate = right.publicationDate.localeCompare(left.publicationDate);
    return byDate === 0 ? left.title.localeCompare(right.title) : byDate;
  });
}

export function filterArticles(
  articles: readonly ArticleSummary[],
  category: string,
  query: string,
): ArticleSummary[] {
  const normalizedQuery = query.trim().toLowerCase();
  return articles.filter((article) => {
    if (category !== ALL_INSIGHT_CATEGORIES && article.category !== category) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = [article.title, article.description, ...article.tags].join('\n').toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function featuredArticle(articles: readonly ArticleSummary[]): ArticleSummary | null {
  return articles.find((article) => article.featured) ?? null;
}

export function relatedArticles(
  articles: readonly ArticleSummary[],
  currentSlug: string,
  limit = 3,
): ArticleSummary[] {
  const current = articles.find((article) => article.slug === currentSlug);
  if (!current) {
    return [];
  }

  const sameCategory = articles.filter(
    (article) => article.slug !== currentSlug && article.category === current.category,
  );
  const others = articles.filter(
    (article) => article.slug !== currentSlug && article.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function adjacentArticles(
  articles: readonly ArticleSummary[],
  currentSlug: string,
): { previous: ArticleSummary | null; next: ArticleSummary | null } {
  const index = articles.findIndex((article) => article.slug === currentSlug);
  if (index < 0) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? articles[index - 1] : null,
    next: index < articles.length - 1 ? articles[index + 1] : null,
  };
}

export function assignHeadingIds(root: ParentNode, toc: readonly TocItem[]): void {
  const headings = root.querySelectorAll('h2, h3, h4');
  headings.forEach((heading, index) => {
    const fallback = slugifyHeading(heading.textContent ?? '');
    heading.id = toc[index]?.id ?? fallback;
  });
}

export function decorateMarkdown(root: ParentNode): void {
  root.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    if (/^https?:\/\//i.test(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  });

  root.querySelectorAll('img').forEach((image) => {
    if (!image.hasAttribute('alt')) {
      image.setAttribute('alt', '');
    }
    // A Markdown image has no box until it decodes. Lazy-loading that box
    // can leave the request unstarted. Only defer images that already reserve space.
    if (!image.getAttribute('loading') && image.getAttribute('width')) {
      image.setAttribute('loading', 'lazy');
    }
  });
}

export function toArticleSummary(article: Article): ArticleSummary {
  const { body: _body, toc: _toc, ...summary } = article;
  return summary;
}

function splitFrontMatter(raw: string): { data: Record<string, unknown>; body: string } {
  const source = raw.replace(/^\uFEFF/, '');
  const match = FRONT_MATTER_PATTERN.exec(source);
  if (!match) {
    throw new ArticleContentError('Article is missing front matter.');
  }

  return {
    data: parseFrontMatterBlock(match[1]),
    body: source.slice(match[0].length).replace(/^\s+/, ''),
  };
}

function parseFrontMatterBlock(block: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  let listKey: string | null = null;

  for (const line of block.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const listItem = /^\s+-\s+(.+)$/.exec(line);
    if (listItem) {
      if (!listKey) {
        throw new ArticleContentError(`Front matter list item has no field: ${line.trim()}`);
      }
      const list = Array.isArray(data[listKey]) ? (data[listKey] as string[]) : [];
      list.push(unquote(listItem[1].trim()));
      data[listKey] = list;
      continue;
    }

    const field = /^([A-Za-z][A-Za-z0-9]*)\s*:\s*(.*)$/.exec(line);
    if (!field) {
      throw new ArticleContentError(`Cannot read front matter line: ${line.trim()}`);
    }

    const key = field[1];
    const value = field[2].trim();
    if (!value) {
      listKey = key;
      data[key] = [];
      continue;
    }

    listKey = null;
    data[key] = coerceScalar(unquote(value));
  }

  return data;
}

function coerceScalar(value: string): string | number | boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (/^[1-9]\d*$/.test(value)) {
    return Number(value);
  }
  return value;
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function requiredString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new ArticleContentError(`Front matter is missing ${key}.`);
  }
  return value.trim();
}

function optionalString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value.trim() : '';
}

function requiredDate(data: Record<string, unknown>, key: string): string {
  const value = requiredString(data, key);
  if (!DATE_PATTERN.test(value)) {
    throw new ArticleContentError(`Front matter ${key} must use YYYY-MM-DD.`);
  }
  return value;
}

function requiredCategory(data: Record<string, unknown>): InsightCategory {
  const value = requiredString(data, 'category');
  if (!(INSIGHT_CATEGORIES as readonly string[]).includes(value)) {
    throw new ArticleContentError(`Unknown article category: ${value}`);
  }
  return value as InsightCategory;
}

function requiredTags(data: Record<string, unknown>): string[] {
  const value = data['tags'];
  if (!Array.isArray(value) || value.length === 0) {
    throw new ArticleContentError('Front matter tags must be a non-empty list.');
  }
  if (value.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    throw new ArticleContentError('Front matter tags must be text.');
  }
  return value.map((tag) => tag.trim());
}

function requiredBoolean(data: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = data[key];
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'boolean') {
    throw new ArticleContentError(`Front matter ${key} must be true or false.`);
  }
  return value;
}

function requiredReadingTime(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new ArticleContentError('Front matter readingTime must be a positive whole number.');
  }
  return value;
}

function normalizeAssetPath(path: string): string {
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('/')) {
    return path;
  }
  return path.replace(/^\.\//, '');
}

function cleanHeadingText(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
}

function stripFencedCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
}
