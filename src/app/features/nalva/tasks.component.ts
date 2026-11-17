import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-nalva-tasks',
  standalone: true,
  imports: [],
  templateUrl: './tasks.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaTasksComponent {}
