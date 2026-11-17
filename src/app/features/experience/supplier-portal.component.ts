import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExperienceService, SupplierPortalView } from '../../core/services/experience.service';

@Component({
  selector: 'app-supplier-portal',
  standalone: true,
  imports: [],
  templateUrl: './supplier-portal.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly experience = inject(ExperienceService);
  readonly data = signal<SupplierPortalView | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.experience.supplierPortal(token).subscribe({
      next: (data) => this.data.set(data),
      error: () => this.error.set('This supplier link is invalid or has expired.'),
    });
  }
}
