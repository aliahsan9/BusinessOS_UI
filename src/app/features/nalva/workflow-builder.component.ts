import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-nalva-workflow-builder',
  standalone: true,
  imports: [],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./nalva.shared.scss', './workflow-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkflowBuilderComponent {}
