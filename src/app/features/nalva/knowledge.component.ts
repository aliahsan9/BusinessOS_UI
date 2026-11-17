import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaKnowledge, NalvaMemory } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-knowledge',
  standalone: true,
  imports: [],
  templateUrl: './knowledge.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaKnowledgeComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly rows = signal<NalvaKnowledge[]>([]);
  readonly memory = signal<NalvaMemory[]>([]);
  readonly title = signal('');
  readonly content = signal('');
  readonly agentKey = signal('');
  readonly memoryAgent = signal('support');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.knowledge(this.agentKey() || undefined).subscribe({ next: (rows) => this.rows.set(rows) });
    if (this.memoryAgent()) {
      this.api.memory(this.memoryAgent()).subscribe({ next: (rows) => this.memory.set(rows) });
    }
  }

  add(): void {
    this.api.addKnowledge(this.title(), this.content(), this.agentKey() || undefined).subscribe({
      next: () => { this.title.set(''); this.content.set(''); this.load(); },
    });
  }

  remove(id: string): void {
    this.api.deleteKnowledge(id).subscribe({ next: () => this.load() });
  }

  forget(id: string): void {
    this.api.deleteMemory(id).subscribe({ next: () => this.load() });
  }
}
