import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { ExperienceService } from '../../core/services/experience.service';

@Component({
  selector: 'app-supplier-access',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './supplier-access.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierAccessComponent implements OnInit {
  private readonly suppliers = inject(SupplierService);
  private readonly experience = inject(ExperienceService);
  readonly options = signal<{ id: string; name: string }[]>([]);
  readonly supplierId = signal('');
  readonly email = signal('');
  readonly link = signal<string | null>(null);
  readonly linkId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.suppliers.getAll({ page: 1, pageSize: 100 }).subscribe({
      next: (page) => this.options.set((page.items ?? []).map((item) => ({ id: item.id, name: item.name }))),
      error: () => this.error.set('Suppliers could not be loaded.'),
    });
  }

  create(): void {
    this.experience.createSupplierLink(this.supplierId(), this.email()).subscribe({
      next: (created) => {
        this.linkId.set(created.id);
        this.link.set(`${location.origin}/supplier-portal/${created.token}`);
        this.error.set(null);
      },
      error: () => this.error.set('The supplier link could not be created.'),
    });
  }

  revoke(): void {
    const id = this.linkId();
    if (!id) return;
    this.experience.revokeSupplierLink(id).subscribe({
      next: () => {
        this.link.set(null);
        this.linkId.set(null);
      },
      error: () => this.error.set('The link could not be revoked.'),
    });
  }
}
