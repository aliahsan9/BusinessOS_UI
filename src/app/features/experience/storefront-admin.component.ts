import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExperienceService, StorefrontAdmin } from '../../core/services/experience.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-storefront-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './storefront-admin.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontAdminComponent implements OnInit {
  private readonly experience = inject(ExperienceService);
  private readonly products = inject(ProductService);
  readonly profile = signal<StorefrontAdmin | null>(null);
  readonly productOptions = signal<{ id: string; name: string }[]>([]);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  offering = this.blankOffering();
  packageDraft = { name: '', pricingModel: 'fixed', price: null as number | null, scope: '', isPublished: true };
  portfolioDraft = { title: '', summary: '', technologies: '', industry: '', projectUrl: '', results: '', isPublished: false };

  ngOnInit(): void {
    this.reload();
    this.products.getAll({ page: 1, pageSize: 100 }).subscribe({
      next: (page) => this.productOptions.set((page.items ?? []).map((item) => ({ id: item.id, name: item.name }))),
      error: () => this.productOptions.set([]),
    });
  }

  reload(): void {
    this.experience.storefront().subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.error.set('The storefront could not be loaded.'),
    });
  }

  saveProfile(): void {
    const profile = this.profile();
    if (!profile) return;
    this.experience.saveStorefront(profile).subscribe({
      next: (saved) => {
        this.profile.set(saved);
        this.notice.set(saved.isPublished ? 'The public profile is published.' : 'The public profile is unpublished.');
      },
      error: () => this.error.set('The profile could not be saved.'),
    });
  }

  addOffering(): void {
    const body = { ...this.offering, productId: this.offering.productId || null };
    this.experience.saveOffering(body).subscribe({
      next: () => {
        this.offering = this.blankOffering();
        this.reload();
      },
      error: () => this.error.set('The offering could not be saved. Products must be linked to a catalog item.'),
    });
  }

  addPackage(): void {
    this.experience.savePackage(this.packageDraft).subscribe({
      next: () => {
        this.packageDraft = { name: '', pricingModel: 'fixed', price: null, scope: '', isPublished: true };
        this.reload();
      },
      error: () => this.error.set('The package could not be saved.'),
    });
  }

  addPortfolio(): void {
    this.experience.savePortfolio(this.portfolioDraft).subscribe({
      next: () => {
        this.portfolioDraft = { title: '', summary: '', technologies: '', industry: '', projectUrl: '', results: '', isPublished: false };
        this.reload();
      },
      error: () => this.error.set('The portfolio item could not be saved.'),
    });
  }

  moderate(id: string, status: string): void {
    this.experience.moderateReview(id, status).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The review could not be updated.'),
    });
  }

  private blankOffering() {
    return {
      kind: 'service',
      productId: '',
      name: '',
      summary: '',
      pricingModel: 'quote',
      price: null as number | null,
      deliverables: '',
      deliveryTime: '',
      isFeatured: false,
      isPublished: false,
    };
  }
}
