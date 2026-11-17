import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaOverview } from '../../core/models/nalva.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './overview.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaOverviewComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;
  readonly data = signal<NalvaOverview | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.overview().subscribe({
      next: (value) => this.data.set(value),
      error: () => this.error.set('The workforce overview could not be loaded.'),
    });
  }
}
