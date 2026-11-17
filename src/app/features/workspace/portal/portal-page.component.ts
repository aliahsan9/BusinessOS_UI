import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { PortalProject, WorkspaceApiService, workspaceError } from '../workspace-api.service';

@Component({
  selector: 'app-portal-page',
  standalone: true,
  imports: [FormsModule, AppAlertComponent, AppPageHeaderComponent, AppSkeletonComponent],
  templateUrl: './portal-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalPageComponent implements OnInit {
  private readonly api = inject(WorkspaceApiService);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly projects = signal<PortalProject[]>([]);
  message = '';
  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.api.portal(this.token).subscribe({
      next: (rows) => { this.projects.set(rows); this.loading.set(false); },
      error: (error: unknown) => { this.error.set(workspaceError(error)); this.loading.set(false); },
    });
  }

  send(projectId: string): void {
    this.api.portalFeedback(this.token, projectId, this.message).subscribe({
      next: () => { this.message = ''; this.error.set(null); },
      error: (error: unknown) => this.error.set(workspaceError(error)),
    });
  }

  fileUrl(projectFileId: string): string {
    return `/api/v1/portal/${encodeURIComponent(this.token)}/files/${projectFileId}`;
  }
}
