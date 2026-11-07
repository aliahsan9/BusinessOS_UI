import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { of } from 'rxjs';
import { Article, ArticleSummary } from '../../models/article.model';
import { InsightsService } from '../../services/insights.service';
import { extractToc } from '../../utils/article-content';
import { ArticleDetailComponent } from './article-detail.component';
import { InsightsListComponent } from '../insights-list/insights-list.component';

const BODY = `Most companies share one deployment and still need separate data.

## Tenant isolation

The filter belongs on every query.

### Query filters

EF Core can attach the predicate.

## Trade-offs

Pick the failure mode you can detect.
`;

describe('ArticleDetailComponent', () => {
  let fixture: ComponentFixture<ArticleDetailComponent>;
  const summaries = [
    summary('multi-tenant-saas-architecture', 'SaaS Architecture', '2026-10-18'),
    summary('erp-security-reliability', 'Security', '2026-10-02'),
    summary('ai-rag-business-software', 'AI & Automation', '2026-09-16'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleDetailComponent],
      providers: [
        provideRouter([
          { path: 'insights', component: InsightsListComponent },
          { path: 'insights/:slug', component: ArticleDetailComponent },
        ]),
        provideLocationMocks(),
        provideMarkdown(),
        {
          provide: InsightsService,
          useValue: {
            getArticles: () => of(summaries),
            getArticle: (slug: string) => of(slug === 'multi-tenant-saas-architecture' ? fullArticle() : null),
            clearCache: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleDetailComponent);
  });

  it('renders a valid article, its table of contents, and neighboring links', async () => {
    fixture.componentRef.setInput('slug', 'multi-tenant-saas-architecture');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tenant isolation for a shared platform');
    expect(text).toContain('9 min read');
    expect(text).toContain('BusinessOS');
    expect(fixture.nativeElement.querySelector('.article-toc--inline')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.article-toc--sidebar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="#tenant-isolation"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="#query-filters"]')).not.toBeNull();
    expect(text).toContain('Next');
  });

  it('shows a not-found state for an unknown slug and can return to the list', async () => {
    fixture.componentRef.setInput('slug', 'missing-article');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Article not found');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/insights');
    expect(router.url).toBe('/insights');
  });
});

function fullArticle(): Article {
  return {
    ...summary('multi-tenant-saas-architecture', 'SaaS Architecture', '2026-10-18'),
    title: 'Tenant isolation for a shared platform',
    body: BODY,
    toc: extractToc(BODY),
  };
}

function summary(slug: string, category: ArticleSummary['category'], publicationDate: string): ArticleSummary {
  return {
    title: slug,
    slug,
    description: 'How shared software keeps customer data apart.',
    category,
    author: 'BusinessOS',
    publicationDate,
    updatedDate: '2026-11-02',
    readingTime: 9,
    featuredImage: `assets/blog/${slug}/cover.svg`,
    featuredImageAlt: 'Cover',
    tags: ['multi-tenancy'],
    featured: true,
  };
}
