import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentEmployeeService } from '../../../../core/services/agent-employee.service';
import { AiChatService } from '../../../../core/services/ai-chat.service';
import { AiAssistantStateService } from '../../../../state/ai-assistant.state';
import { AskSophiaSuggestions } from '../../../../core/models/agent.model';
import { AiDashboardCopilot, AiProactiveInsight } from '../../../../core/models/ai.model';
import { ROUTES } from '../../../../core/constants/route.constants';
import { AppCardComponent } from '../../app-card/app-card.component';

@Component({
  selector: 'app-dashboard-copilot',
  standalone: true,
  imports: [RouterLink, AppCardComponent],
  templateUrl: './dashboard-copilot.component.html',
  styleUrl: './dashboard-copilot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCopilotComponent implements OnInit {
  private readonly aiChat = inject(AiChatService);
  private readonly agentService = inject(AgentEmployeeService);
  private readonly aiState = inject(AiAssistantStateService);

  readonly askQuestion = output<string>();
  readonly routes = ROUTES;
  readonly copilot = signal<AiDashboardCopilot | null>(null);
  readonly insights = signal<AiProactiveInsight[]>([]);
  readonly askSophia = signal<AskSophiaSuggestions | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.aiChat.getDashboardCopilot().subscribe({
      next: (data) => {
        this.copilot.set(data);
        this.insights.set(data.insights);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.agentService.getAskSophiaSuggestions().subscribe({
      next: (data) => this.askSophia.set(data),
      error: () => undefined,
    });
  }

  onFocus(message: string): void {
    this.askQuestion.emit(message);
    this.aiState.askSophia(message);
  }

  openSophia(message?: string): void {
    if (message) {
      this.aiState.askSophia(message);
      this.askQuestion.emit(message);
    } else {
      this.aiState.open();
    }
  }
}
