import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'protocol-session',
    loadChildren: () => import('./protocol-session/protocol-session.module').then(m => m.ProtocolSessionModule)
  },
  {
    path: 'protocol-editor',
    loadChildren: () => import('./protocol-editor/protocol-editor.module').then(m => m.ProtocolEditorModule)
  },
  {
    path: 'accounts',
    loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule)
  },
  {
    path: 'session-editor',
    loadChildren: () => import('./session-editor/session-editor.module').then(m => m.SessionEditorModule)
  },
  {
    path: 'calendar',
    loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule)
  },
  {
    path: 'project-editor',
    loadChildren: () => import('./project-editor/project-editor.module').then(m => m.ProjectEditorModule)
  },
  {
    path: 'instruments',
    loadChildren: () => import('./instruments/instruments.module').then(m => m.InstrumentsModule)
  },
  {
    path: 'reagent-store',
    loadChildren: () => import('./reagent-store/reagent-store.module').then(m => m.ReagentStoreModule)
  }
  ,
  {
    path: 'sdrf-playground',
    loadChildren: () => import('./metadata-playground/metadata-playground.module').then(m => m.MetadataPlaygroundModule)
  },
  {
    path: '**',
    redirectTo: 'home'
  },


];
