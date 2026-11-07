import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';
import { NavbarComponent } from '../../../navbar/navbar.component';
import { FooterComponent } from '../../../footer/footer.component';
import { ArticleCardComponent } from '../../components/article-card/article-card.component';
import { ArticleHeaderComponent } from '../../components/article-header/article-header.component';
import { ArticleTocComponent } from '../../components/article-toc/article-toc.component';
import { Article, ArticleSummary } from '../../models/article.model';
import { loadPrism } from '../../prism-loader';
import { InsightsSeoService } from '../../services/insights-seo.service';
import { InsightsService } from '../../services/insights.service';
import { adjacentArticles, assignHeadingIds, decorateMarkdown, relatedArticles } from '../../utils/article-content';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    RouterLink,
    MarkdownComponent,
    NavbarComponent,
    FooterComponent,
    ArticleHeaderComponent,
    ArticleTocComponent,
    ArticleCardComponent,
  ],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailComponent {
  private readonly insights = inject(InsightsService);
  private readonly seo = inject(InsightsSeoService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly slug = input.required<string>();
  readonly article = signal<Article | null>(null);
  readonly catalog = signal<ArticleSummary[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly activeId = signal('');
  readonly showBackToTop = signal(false);

  readonly related = computed(() => relatedArticles(this.catalog(), this.slug()));
  readonly neighbors = computed(() => adjacentArticles(this.catalog(), this.slug()));

  private requestId = 0;
  private appliedKey = '';
  private observer?: IntersectionObserver;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      if (this.appliedKey) {
        this.seo.release(this.appliedKey);
      }
    });

    effect(() => {
      const slug = this.slug();
      untracked(() => {
        void this.load(slug);
      });
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showBackToTop.set(window.scrollY > 500);
  }

  onMarkdownReady(): void {
    const article = this.article();
    const root = this.host.nativeElement.querySelector('.insights-markdown');
    if (!article || !root) {
      return;
    }

    assignHeadingIds(root, article.toc);
    decorateMarkdown(root);
    this.observeHeadings(root);
    this.scrollToHash();
  }

  scrollToTop(): void {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  private async load(slug: string): Promise<void> {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.notFound.set(false);
    this.article.set(null);
    this.activeId.set('');
    window.scrollTo({ top: 0, behavior: 'auto' });

    await loadPrism().catch(() => undefined);
    if (requestId !== this.requestId) {
      return;
    }

    try {
      const [article, catalog] = await Promise.all([
        firstValueFrom(this.insights.getArticle(slug)),
        firstValueFrom(this.insights.getArticles()).catch(() => [] as ArticleSummary[]),
      ]);
      if (requestId !== this.requestId) {
        return;
      }

      this.catalog.set(catalog);
      this.article.set(article);
      this.notFound.set(article === null);
      if (article) {
        this.activeId.set(article.toc[0]?.id ?? '');
        this.appliedKey = this.seo.applyArticle(article);
      } else {
        this.appliedKey = this.seo.applyNotFound();
      }
    } catch {
      if (requestId !== this.requestId) {
        return;
      }
      this.notFound.set(true);
      this.appliedKey = this.seo.applyNotFound();
    } finally {
      if (requestId === this.requestId) {
        this.loading.set(false);
      }
    }
  }

  private observeHeadings(root: Element): void {
    this.observer?.disconnect();
    const headings = [...root.querySelectorAll('h2[id], h3[id], h4[id]')];
    if (!headings.length || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        const id = visible[0]?.target.id;
        if (id) {
          this.activeId.set(id);
        }
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: [0, 1] },
    );
    headings.forEach((heading) => this.observer?.observe(heading));
  }

  private scrollToHash(): void {
    const id = window.location.hash.replace(/^#/, '');
    if (!id) {
      return;
    }
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      this.activeId.set(id);
    });
  }
}
