import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ArticleSummary } from '../../models/article.model';
import { InsightsService } from '../../services/insights.service';
import { InsightsListComponent } from './insights-list.component';

describe('InsightsListComponent', () => {
  let fixture: ComponentFixture<InsightsListComponent>;

  const articles: ArticleSummary[] = [
    article('multi-tenant-saas-architecture', 'SaaS Architecture', 'Tenant isolation', ['ef-core'], true, '2026-10-18'),
    article('ai-rag-business-software', 'AI & Automation', 'Retrieval and tools', ['vector'], true, '2026-09-16'),
    article('erp-security-reliability', 'Security', 'Tokens and audit logs', ['jwt'], false, '2026-10-02'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsListComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        {
          provide: InsightsService,
          useValue: { getArticles: () => of(articles), clearCache: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InsightsListComponent);
    fixture.detectChanges();
  });

  it('shows the featured article and the remaining cards', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('BusinessOS Insights');
    expect(text).toContain('Practical insights on building smarter businesses');
    expect(text).toContain('Tenant isolation');
    expect(fixture.nativeElement.querySelector('.article-card--feature')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.insights-grid .col-md-6').length).toBe(2);
  });

  it('filters by category', () => {
    clickCategory('Security');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tokens and audit logs');
    expect(text).not.toContain('Retrieval and tools');
    expect(fixture.nativeElement.querySelector('.article-card--feature')).toBeNull();
  });

  it('searches title, description, and tags', () => {
    setSearch('vector');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Retrieval and tools');
    expect(text).not.toContain('Tenant isolation');
  });

  it('shows an empty state when nothing matches', () => {
    setSearch('no-such-article');
    expect(fixture.nativeElement.textContent).toContain('No articles match that search');
  });

  function clickCategory(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((item: HTMLButtonElement) =>
      item.textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  function setSearch(value: string): void {
    const input = fixture.nativeElement.querySelector('#insights-search') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
});

function article(
  slug: string,
  category: ArticleSummary['category'],
  title: string,
  tags: string[],
  featured: boolean,
  publicationDate: string,
): ArticleSummary {
  return {
    title,
    slug,
    description: `${title} for operators and engineers.`,
    category,
    author: 'BusinessOS',
    publicationDate,
    updatedDate: publicationDate,
    readingTime: 9,
    featuredImage: `assets/blog/${slug}/cover.svg`,
    featuredImageAlt: title,
    tags,
    featured,
  };
}
