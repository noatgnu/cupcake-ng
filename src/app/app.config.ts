import {ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, DOCUMENT} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
} from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {authInterceptor} from "./auth.interceptor";
import {QuillModule} from "ngx-quill";




export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withHashLocation(),
      withComponentInputBinding(),
    ),
    provideAppInitializer(() => {
      const window: any = inject(DOCUMENT).defaultView;
      if (window) {
        window['_appStarted'] = true;
      }
    })
    ,
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(QuillModule.forRoot(

    ))
  ],
};
