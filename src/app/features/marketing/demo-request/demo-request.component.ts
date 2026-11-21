import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GrowthService } from '../../../core/services/growth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-demo-request',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './demo-request.component.html',
  styleUrl: './demo-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoRequestComponent {
  private readonly fb = inject(FormBuilder);
  private readonly growth = inject(GrowthService);

  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    message: ['', Validators.required],
    marketingOptIn: [false],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.growth
      .submitLead({
        fullName: value.fullName,
        email: value.email,
        company: value.company || undefined,
        kind: 'Demo',
        topic: 'Product demo',
        subject: 'Demo request',
        message: value.message,
        sourcePath: '/demo',
        marketingOptIn: value.marketingOptIn,
      })
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.submitting.set(false);
          this.form.reset({ marketingOptIn: false });
        },
        error: () => {
          this.error.set('We could not save your request. Email support@businessos.com or try again.');
          this.submitting.set(false);
        },
      });
  }
}
