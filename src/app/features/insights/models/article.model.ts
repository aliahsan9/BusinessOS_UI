export const INSIGHT_CATEGORIES = [
  'AI & Automation',
  'Business Management',
  'SaaS Architecture',
  'Inventory & Operations',
  'Data & Analytics',
  'Security',
] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const ALL_INSIGHT_CATEGORIES = 'All';

/** Desktop width at which the article table of contents becomes a sticky sidebar. */
export const INSIGHTS_SIDEBAR_MIN_WIDTH = 1100;

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

export interface ArticleSummary {
  title: string;
  slug: string;
  description: string;
  category: InsightCategory;
  author: string;
  publicationDate: string;
  updatedDate: string;
  readingTime: number;
  featuredImage: string;
  featuredImageAlt: string;
  tags: string[];
  featured: boolean;
}

export interface Article extends ArticleSummary {
  body: string;
  toc: TocItem[];
}

export interface BlogIndex {
  articles?: unknown;
}
