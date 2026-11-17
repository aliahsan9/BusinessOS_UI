import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaTask } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-tasks',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './tasks.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaTasksComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly tasks = signal<NalvaTask[]>([]);
  readonly agentKey = signal('ceo');
  readonly objective = signal('');
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.tasks().subscribe({
      next: (rows) => this.tasks.set(rows),
      error: () => this.error.set('Tasks could not be loaded.'),
    });
  }

  enqueue(): void {
    this.api.enqueue(this.agentKey(), this.objective()).subscribe({
      next: () => { this.objective.set(''); this.load(); },
      error: () => this.error.set('The task was not queued. Activate the agent first.'),
    });
  }

  act(id: string, action: 'cancel' | 'pause' | 'resume'): void {
    const call = action === 'cancel' ? this.api.cancelTask(id) : action === 'pause' ? this.api.pauseTask(id) : this.api.resumeTask(id);
    call.subscribe({ next: () => this.load() });
  }
}
