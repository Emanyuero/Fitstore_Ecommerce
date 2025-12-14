import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';

const mainAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(
      ToastrModule.forRoot({
        timeOut: 2500,
        positionClass: 'toast-bottom-center',
        preventDuplicates: true
      })
    )
  ]
};

bootstrapApplication(App, mainAppConfig)
  .catch((err) => console.error(err));
