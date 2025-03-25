import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
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
import {LoadingTrackerService} from "./loading-tracker.service";

export function initializeAppFactory(loadingTracker: LoadingTrackerService) {
  return () => {
    const originalAppendChild = document.head.appendChild.bind(document.head);
    // @ts-ignore
    document.head.appendChild = (element: HTMLElement) => {
      if (element.tagName === 'SCRIPT' && (element as HTMLScriptElement).src) {
        const scriptElement = element as HTMLScriptElement;
        const chunkName = scriptElement.src.split('/').pop();
        loadingTracker.setLoadingChunk(chunkName || 'unknown');
        scriptElement.onload = () => loadingTracker.clearLoadingChunk();
      }
      console.log('Appending element', element);
      return originalAppendChild(element);
    };
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withHashLocation(),
      withComponentInputBinding(),
      withPreloading(PreloadAllModules)
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [LoadingTrackerService],
      multi: true
    }
    ,
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(QuillModule.forRoot(

    ))
  ],
};
