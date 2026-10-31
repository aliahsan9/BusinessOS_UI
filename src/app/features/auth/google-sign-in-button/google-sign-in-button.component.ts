import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';

@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  templateUrl: './google-sign-in-button.component.html',
  styleUrl: './google-sign-in-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleSignInButtonComponent implements AfterViewInit, OnDestroy {
  private readonly google = inject(GoogleIdentityService);
  private readonly officialHost = viewChild<ElementRef<HTMLElement>>('official');
  private resizeObserver: ResizeObserver | null = null;

  readonly disabled = input(false);
  readonly loading = input(false);
  readonly credential = output<string>();

  readonly configured = signal(this.google.isConfigured);
  readonly failed = signal(false);

  ngAfterViewInit(): void {
    if (!this.google.isConfigured) {
      return;
    }

    void this.google.initialize((idToken) => this.credential.emit(idToken)).then(
      () => {
        const host = this.officialHost()?.nativeElement;
        if (!host) {
          return;
        }

        this.google.renderButton(host);
        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.google.renderButton(host));
          this.resizeObserver.observe(host);
        }
      },
      () => this.failed.set(true),
    );
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
