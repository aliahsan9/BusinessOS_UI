import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LaunchNotice, LaunchService } from '../../core/services/launch.service';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-early-access',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './early-access.component.html',
  styleUrl: './launch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarlyAccessComponent implements OnInit {
  private readonly launch = inject(LaunchService);
  readonly routes = ROUTES;
  readonly notice = signal<LaunchNotice | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.launch.notice().subscribe({
      next: (notice) => this.notice.set(notice),
      error: () => this.error.set('The early-access notice could not be loaded.'),
    });
  }
}
