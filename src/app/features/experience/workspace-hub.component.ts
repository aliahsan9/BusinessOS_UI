import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExperienceService, WorkspaceExperience } from '../../core/services/experience.service';

@Component({
  selector: 'app-workspace-hub',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './workspace-hub.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceHubComponent implements OnInit {
  private readonly experience = inject(ExperienceService);
  readonly data = signal<WorkspaceExperience | null>(null);
  readonly workspace = signal('general');
  readonly error = signal<string | null>(null);
  readonly options = [
    { id: 'agency', label: 'Agency' },
    { id: 'retail', label: 'Retail' },
    { id: 'service', label: 'Service business' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'general', label: 'General' },
  ];

  ngOnInit(): void {
    this.experience.workspace().subscribe({
      next: (data) => {
        this.data.set(data);
        this.workspace.set(data.workspace);
      },
      error: () => this.error.set('The workspace could not be loaded.'),
    });
  }

  save(): void {
    this.experience.saveWorkspace(this.workspace()).subscribe({
      next: (data) => this.data.set(data),
      error: () => this.error.set('The workspace could not be saved. Organization management permission is required.'),
    });
  }
}
