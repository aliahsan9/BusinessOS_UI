import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AgencySetup, AgencyTemplate, LaunchService } from '../../core/services/launch.service';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-agency-onboarding',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './agency-onboarding.component.html',
  styleUrl: './launch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencyOnboardingComponent implements OnInit {
  private readonly launch = inject(LaunchService);
  private readonly router = inject(Router);

  readonly routes = ROUTES;
  readonly steps = ['Company', 'Profile', 'Workspace', 'AI workforce', 'Plan', 'First objective'];
  readonly setup = signal<AgencySetup | null>(null);
  readonly step = signal(1);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  company = { name: '', logoUrl: '', website: '', description: '', country: '', currency: 'USD', timezone: 'UTC' };
  profile = { templateKey: 'web-development', services: '', technologies: '', teamSize: '', targetClients: '', goals: '' };
  emails = '';
  projectName = '';
  modules: string[] = [];
  roles: string[] = [];
  agents: string[] = [];
  budget: number | null = null;
  planKey = 'free';
  objective = 'Analyze our agency operations and suggest the top five improvements.';
  invitationCode = '';

  ngOnInit(): void {
    this.launch.setup().subscribe({
      next: (setup) => this.apply(setup),
      error: () => this.error.set('Agency setup could not be loaded.'),
    });
  }

  template(): AgencyTemplate | undefined {
    return this.setup()?.templates.find((item) => item.key === this.profile.templateKey);
  }

  chooseTemplate(key: string): void {
    this.profile.templateKey = key;
    const template = this.template();
    if (!template) return;
    this.modules = [...template.modules];
    this.roles = [...template.roles];
    this.agents = [...template.agents];
  }

  setChecked(list: string[], value: string, checked: boolean): void {
    const index = list.findIndex((item) => item.toLowerCase() === value.toLowerCase());
    if (checked && index < 0) list.push(value);
    if (!checked && index >= 0) list.splice(index, 1);
  }

  checked(list: string[], value: string): boolean {
    return list.some((item) => item.toLowerCase() === value.toLowerCase());
  }

  redeem(): void {
    this.saving.set(true);
    this.launch.redeem(this.invitationCode).subscribe({
      next: () => {
        this.saving.set(false);
        this.error.set(null);
        this.reload();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('That invitation is not valid.');
      },
    });
  }

  saveCompany(): void {
    this.save(this.launch.saveCompany(this.company));
  }

  saveProfile(): void {
    this.save(this.launch.saveProfile(this.profile));
  }

  saveWorkspace(): void {
    this.save(this.launch.saveWorkspace({
      modules: this.modules,
      roles: this.roles,
      emails: this.emails.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
      initialProjectName: this.projectName,
    }));
  }

  saveWorkforce(): void {
    this.save(this.launch.saveWorkforce({
      agentKeys: this.agents,
      approvalPreference: 'RequireApproval',
      monthlyBudgetUsd: this.budget,
    }));
  }

  savePlan(): void {
    this.save(this.launch.savePlan({ planKey: this.planKey }));
  }

  saveObjective(): void {
    this.saving.set(true);
    this.launch.saveObjective({ objective: this.objective }).subscribe({
      next: (setup) => {
        this.saving.set(false);
        this.apply(setup);
        void this.router.navigate([ROUTES.dashboard]);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('The first objective could not be queued.');
      },
    });
  }

  private save(request: Observable<AgencySetup>): void {
    this.saving.set(true);
    request.subscribe({
      next: (setup) => {
        this.saving.set(false);
        this.error.set(null);
        this.apply(setup);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('That step could not be saved. Check the fields and try again.');
      },
    });
  }

  private reload(): void {
    this.launch.setup().subscribe({
      next: (setup) => this.apply(setup),
      error: () => this.error.set('Agency setup could not be loaded.'),
    });
  }

  private apply(setup: AgencySetup): void {
    this.setup.set(setup);
    this.step.set(setup.workspace.currentStep || 1);
    const workspace = setup.workspace;
    if (workspace.templateKey) this.profile.templateKey = workspace.templateKey;
    this.profile.services = workspace.services ?? this.profile.services;
    this.profile.technologies = workspace.technologies ?? this.profile.technologies;
    this.profile.teamSize = workspace.teamSize ?? this.profile.teamSize;
    this.profile.targetClients = workspace.targetClients ?? this.profile.targetClients;
    this.profile.goals = workspace.goals ?? this.profile.goals;
    if (workspace.modules.length) this.modules = [...workspace.modules];
    if (workspace.roles.length) this.roles = [...workspace.roles];
    if (workspace.agents.length) this.agents = [...workspace.agents];
    if (workspace.invitedEmails.length) this.emails = workspace.invitedEmails.join(', ');
    this.projectName = workspace.initialProjectName ?? this.projectName;
    this.budget = workspace.monthlyAiBudgetUsd;
    this.planKey = workspace.selectedPlanKey ?? this.planKey;
    this.objective = workspace.firstObjective ?? this.objective;
    if (!workspace.profileSaved && this.modules.length === 0) this.chooseTemplate(this.profile.templateKey);
  }
}
