import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component'; // Verifique se o nome é AppComponent

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));