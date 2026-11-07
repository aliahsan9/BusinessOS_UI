import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ArticleSummary } from '../models/article.model';

const SITE_ORIGIN = 'https://businessos.app';
const JSON_LD_ID = 'insights-jsonld';

const DEFAULT_META = {
  title: 'BusinessOS | AI-Powered Business Management Platform',
  description:
    'BusinessOS is a modern AI-powered business management platform that helps SMEs manage inventory, sales, purchases, customers, analytics, reporting, and business operations from one place.',
  ogTitle: 'BusinessOS | AI-Powered Business Management Platform',
  ogDescription:
    'Manage your entire business from one platform with AI-powered insights, inventory, sales, purchases, reporting, and analytics.',
  url: `${SITE_ORIGIN}/`,
  image: `${SITE_ORIGIN}/assets/images/og-image.png`,
  type: 'website',
};

@Injectable({ providedIn: 'root' })
export class InsightsSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private activeKey: string | null = null;

  applyList(): string {
    this.activeKey = 'insights-list';
    this.removeArticleTags();
    this.write({
      title: 'BusinessOS Insights',
      description:
        'Practical insights on building smarter businesses with AI, automation, and modern business technology.',
      ogTitle: 'BusinessOS Insights',
      ogDescription:
        'Practical insights on building smarter businesses with AI, automation, and modern business technology.',
      url: `${SITE_ORIGIN}/insights`,
      image: DEFAULT_META.image,
      type: 'website',
    });
    this.removeJsonLd();
    return 'insights-list';
  }

  applyArticle(article: ArticleSummary): string {
    this.activeKey = article.slug;
    const url = `${SITE_ORIGIN}/insights/${article.slug}`;
    const image = absoluteAssetUrl(article.featuredImage);
    this.write({
      title: `${article.title} | BusinessOS Insights`,
      description: article.description,
      ogTitle: article.title,
      ogDescription: article.description,
      url,
      image,
      type: 'article',
    });
    this.meta.updateTag({ property: 'article:published_time', content: article.publicationDate });
    this.meta.updateTag({ property: 'article:modified_time', content: article.updatedDate });
    this.meta.updateTag({ property: 'article:author', content: article.author });
    this.meta.updateTag({ name: 'author', content: article.author });
    this.meta.updateTag({ name: 'keywords', content: article.tags.join(', ') });
    this.replaceArticleTags(article.tags);
    this.writeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.publicationDate,
      dateModified: article.updatedDate,
      author: { '@type': 'Organization', name: article.author },
      image,
      mainEntityOfPage: url,
      keywords: article.tags.join(', '),
    });
    return article.slug;
  }

  applyNotFound(): string {
    this.activeKey = 'insights-missing';
    this.removeArticleTags();
    this.write({
      title: 'Article not found | BusinessOS Insights',
      description: 'This BusinessOS Insights article is not available.',
      ogTitle: 'Article not found | BusinessOS Insights',
      ogDescription: 'This BusinessOS Insights article is not available.',
      url: `${SITE_ORIGIN}/insights`,
      image: DEFAULT_META.image,
      type: 'website',
    });
    this.removeJsonLd();
    return 'insights-missing';
  }

  release(key: string): void {
    if (!key || this.activeKey !== key) {
      return;
    }
    this.activeKey = null;
    this.removeArticleTags();
    this.write(DEFAULT_META);
    this.removeJsonLd();
  }

  private write(meta: typeof DEFAULT_META): void {
    this.title.setTitle(meta.title);
    this.meta.updateTag({ name: 'description', content: meta.description });
    this.meta.updateTag({ property: 'og:title', content: meta.ogTitle });
    this.meta.updateTag({ property: 'og:description', content: meta.ogDescription });
    this.meta.updateTag({ property: 'og:url', content: meta.url });
    this.meta.updateTag({ property: 'og:image', content: meta.image });
    this.meta.updateTag({ property: 'og:type', content: meta.type });
    this.meta.updateTag({ property: 'og:site_name', content: 'BusinessOS' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: meta.ogTitle });
    this.meta.updateTag({ name: 'twitter:description', content: meta.ogDescription });
    this.meta.updateTag({ name: 'twitter:image', content: meta.image });
    this.setCanonical(meta.url);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private replaceArticleTags(tags: readonly string[]): void {
    this.removeArticleTags();
    for (const tag of tags) {
      this.meta.addTag({ property: 'article:tag', content: tag });
    }
  }

  private removeArticleTags(): void {
    for (const tag of this.meta.getTags('property="article:tag"')) {
      this.meta.removeTagElement(tag);
    }
    this.meta.removeTag("property='article:published_time'");
    this.meta.removeTag("property='article:modified_time'");
    this.meta.removeTag("property='article:author'");
  }

  private writeJsonLd(data: Record<string, unknown>): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
  }
}

function absoluteAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
