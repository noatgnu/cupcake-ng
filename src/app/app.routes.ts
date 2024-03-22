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
    path: '**',
    redirectTo: 'home'
  },

];
