import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ExperienceService, PublicCompany, PublicSubmission, StorefrontOffering } from '../../core/services/experience.service';

@Component({
  selector: 'app-public-company',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './public-company.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicCompanyComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly experience = inject(ExperienceService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private jsonLd?: HTMLScriptElement;

  readonly company = signal<PublicCompany | null>(null);
  readonly missing = signal(false);
  readonly result = signal<PublicSubmission | null>(null);
  readonly error = signal<string | null>(null);
  readonly selected = signal<StorefrontOffering | null>(null);
  inquiry = this.blank();
  order = { quantity: 1, name: '', email: '', phone: '', address: '', city: '', country: '', postalCode: '', consent: false, companyWebsite: '' };
  review = { displayName: '', rating: 5, body: '', consent: false, companyWebsite: '' };

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.experience.publicCompany(slug).subscribe({
        next: (company) => {
          if (company.redirectSlug) {
            void this.router.navigate(['/company', company.redirectSlug], { replaceUrl: true });
            return;
          }
          this.company.set(company);
          this.applySeo(company);
        },
        error: () => this.missing.set(true),
      });
    });
  }

  ngOnDestroy(): void {
    this.jsonLd?.remove();
  }

  submitInquiry(kind: 'inquiry' | 'booking'): void {
    const company = this.company();
    if (!company) return;
    this.experience.submitInquiry(company.slug, {
      ...this.inquiry,
      kind,
      offeringId: this.selected()?.id,
      clientToken: crypto.randomUUID(),
    }).subscribe({
      next: (result) => this.result.set(result),
      error: () => this.error.set('The request could not be sent. Check the form and try again.'),
    });
  }

  submitOrder(): void {
    const company = this.company();
    const offering = this.selected();
    if (!company || !offering) return;
    this.experience.submitOrder(company.slug, {
      ...this.order,
      offeringId: offering.id,
      clientToken: crypto.randomUUID(),
    }).subscribe({
      next: (result) => this.result.set(result),
      error: () => this.error.set('The order could not be created. The price and stock are checked by the company server.'),
    });
  }

  submitReview(): void {
    const company = this.company();
    if (!company) return;
    this.experience.submitReview(company.slug, { ...this.review, clientToken: crypto.randomUUID() }).subscribe({
      next: (result) => this.result.set(result),
      error: () => this.error.set('The review could not be submitted.'),
    });
  }

  report(id: string): void {
    const company = this.company();
    const reason = window.prompt('Why should this review be reviewed?');
    if (!company || !reason) return;
    this.experience.submitReview(company.slug, { reviewId: id, reportReason: reason, displayName: 'report', rating: 1, body: reason, consent: true }).subscribe({
      next: (result) => this.result.set(result),
      error: () => this.error.set('The report could not be sent.'),
    });
  }

  priceLabel(item: StorefrontOffering, currency: string): string {
    if (item.pricingModel === 'quote' || item.price === null || item.price === undefined) return 'Custom quotation';
    const amount = `${item.price} ${currency}`;
    if (item.pricingModel === 'starting') return `Starting from ${amount}`;
    if (item.pricingModel === 'hourly') return `${amount} hourly`;
    return amount;
  }

  private applySeo(company: PublicCompany): void {
    const pageTitle = company.seoTitle || `${company.name} | CompanyOS`;
    const description = company.seoDescription || company.tagline || company.description || `${company.name} public profile`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    const canonical = `${location.origin}/company/${company.slug}`;
    this.meta.updateTag({ property: 'og:url', content: canonical });
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
    this.jsonLd?.remove();
    this.jsonLd = document.createElement('script');
    this.jsonLd.type = 'application/ld+json';
    this.jsonLd.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: company.name,
      url: canonical,
      email: company.email || undefined,
      telephone: company.phone || undefined,
      description,
    });
    document.head.appendChild(this.jsonLd);
  }

  private blank() {
    return { name: '', email: '', phone: '', budgetRange: '', requirements: '', message: '', consent: false, companyWebsite: '' };
  }
}
