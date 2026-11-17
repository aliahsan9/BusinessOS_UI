import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyAnalytics, LaunchService } from '../../core/services/launch.service';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-launch-desk',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './launch-desk.component.html',
  styleUrl: './launch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaunchDeskComponent implements OnInit {
  private readonly launch = inject(LaunchService);
  readonly routes = ROUTES;
  readonly analytics = signal<CompanyAnalytics | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  kind = 'feedback';
  subject = '';
  body = '';
  rating: number | null = null;
  confirmDelete = false;

  ngOnInit(): void {
    this.launch.analytics().subscribe({
      next: (analytics) => this.analytics.set(analytics),
      error: () => this.error.set('Usage figures could not be loaded.'),
    });
  }

  send(): void {
    this.launch.feedback({
      kind: this.kind,
      subject: this.subject,
      message: this.body,
      rating: this.kind === 'survey' ? this.rating : null,
      page: '/launch',
    }).subscribe({
      next: () => {
        this.message.set('Saved. Security and broken workflows stay ahead of new feature requests.');
        this.error.set(null);
        this.body = '';
      },
      error: () => this.error.set('The note could not be saved.'),
    });
  }

  exportData(): void {
    this.launch.exportData().subscribe({
      next: (result) => {
        const json = result.summaryJson ?? '{}';
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'companyos-export.json';
        link.click();
        URL.revokeObjectURL(url);
        this.message.set(result.procedure);
      },
      error: () => this.error.set('The export could not be created.'),
    });
  }

  requestDeletion(): void {
    if (!this.confirmDelete) {
      this.error.set('Confirm that you want to request deletion.');
      return;
    }
    this.launch.requestDeletion().subscribe({
      next: (result) => {
        this.error.set(null);
        this.message.set(result.procedure);
      },
      error: () => this.error.set('Only the company owner can request deletion.'),
    });
  }
}
