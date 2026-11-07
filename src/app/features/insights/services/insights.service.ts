import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { Article, ArticleSummary, BlogIndex } from '../models/article.model';
import { isValidSlug, parseArticleDocument, sortArticles, toArticleSummary } from '../utils/article-content';

const ASSET_HEADERS = new HttpHeaders({ 'X-Skip-Loading': '1' });

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly http = inject(HttpClient);
  private catalog$: Observable<ArticleSummary[]> | null = null;
  private readonly articlesBySlug = new Map<string, Article>();

  getArticles(): Observable<ArticleSummary[]> {
    this.catalog$ ??= this.http
      .get<BlogIndex>('assets/blog/index.json', { headers: ASSET_HEADERS })
      .pipe(
        switchMap((index) => {
          const slugs = Array.isArray(index?.articles) ? index.articles.filter(isSlug) : [];
          if (slugs.length === 0) {
            return of([] as ArticleSummary[]);
          }
          return forkJoin(slugs.map((slug) => this.getArticle(slug).pipe(map((article) => article))));
        }),
        map((articles) => sortArticles(articles.filter((article): article is Article => article !== null)).map(toArticleSummary)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.catalog$;
  }

  getArticle(slug: string): Observable<Article | null> {
    if (!isValidSlug(slug)) {
      return of(null);
    }

    const cached = this.articlesBySlug.get(slug);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get(`assets/blog/${slug}/article.md`, { headers: ASSET_HEADERS, responseType: 'text' })
      .pipe(
        map((raw) => {
          const article = parseArticleDocument(raw, slug);
          this.articlesBySlug.set(slug, article);
          return article;
        }),
        catchError(() => of(null)),
      );
  }

  clearCache(): void {
    this.catalog$ = null;
    this.articlesBySlug.clear();
  }
}

function isSlug(value: unknown): value is string {
  return typeof value === 'string' && isValidSlug(value);
}
