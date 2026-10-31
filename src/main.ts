import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadRuntimeConfig } from './app/core/config/runtime-config';

loadRuntimeConfig()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((err: unknown) => {
    const message = err instanceof Error
      ? err.message
      : 'BusinessOS configuration failed to load.';
    document.body.textContent = message;
    console.error(message);
  });
