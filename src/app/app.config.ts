import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withPreloading
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
      withPreloading(PreloadAllModules)
    ),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(QuillModule.forRoot(

    ))
  ],
};
