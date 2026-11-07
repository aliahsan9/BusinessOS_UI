import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { FooterComponent } from '../../../footer/footer.component';
import { ArticleCardComponent } from '../../components/article-card/article-card.component';
import { ALL_INSIGHT_CATEGORIES, ArticleSummary, INSIGHT_CATEGORIES } from '../../models/article.model';
import { InsightsSeoService } from '../../services/insights-seo.service';
import { InsightsService } from '../../services/insights.service';
import { featuredArticle, filterArticles } from '../../utils/article-content';

@Component({
  selector: 'app-insights-list',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, ArticleCardComponent],
  templateUrl: './insights-list.component.html',
  styleUrl: './insights-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsListComponent {
  private readonly insights = inject(InsightsService);
  private readonly seo = inject(InsightsSeoService);
  private readonly loadRequests = new Subject<void>();

  readonly categories = INSIGHT_CATEGORIES;
  readonly allCategories = ALL_INSIGHT_CATEGORIES;
  readonly articles = signal<ArticleSummary[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly query = signal('');
  readonly category = signal<string>(ALL_INSIGHT_CATEGORIES);

  readonly showHero = computed(() => !this.query().trim() && this.category() === ALL_INSIGHT_CATEGORIES);
  readonly hero = computed(() => (this.showHero() ? featuredArticle(this.articles()) : null));
  readonly visibleArticles = computed(() => {
    const filtered = filterArticles(this.articles(), this.category(), this.query());
    const hero = this.hero();
    return hero ? filtered.filter((article) => article.slug !== hero.slug) : filtered;
  });
  readonly resultLabel = computed(() => {
    const count = this.visibleArticles().length + (this.hero() ? 1 : 0);
    const noun = count === 1 ? 'article' : 'articles';
    return `${count} ${noun}`;
  });

  constructor() {
    const seoKey = this.seo.applyList();
    inject(DestroyRef).onDestroy(() => this.seo.release(seoKey));
    this.loadRequests
      .pipe(
        switchMap(() =>
          this.insights.getArticles().pipe(
            catchError(() => {
              this.loading.set(false);
              this.loadFailed.set(true);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((articles) => {
        this.articles.set(articles);
        this.loading.set(false);
        this.loadFailed.set(false);
      });
    this.reload();
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  selectCategory(category: string): void {
    this.category.set(category);
  }

  clearSearch(): void {
    this.query.set('');
    this.category.set(ALL_INSIGHT_CATEGORIES);
  }

  reload(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.loadRequests.next();
  }

  retry(): void {
    this.insights.clearCache();
    this.reload();
  }
}
