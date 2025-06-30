import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { BackupService } from './backup.service';
import {BackupLogViewerComponent} from "./backup-log-viewer/backup-log-viewer.component";

const routes: Routes = [
  {
    component: BackupLogViewerComponent,
    path: 'log-viewer'
  },
  {
    path: '',
    redirectTo: 'log-viewer',
    pathMatch: 'full',
  }
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  providers: [
    BackupService
  ],
  exports: [
    // Export any components when created
  ]
})
export class BackupModule { }
