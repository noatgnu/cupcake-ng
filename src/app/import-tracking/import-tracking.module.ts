import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ImportTrackingListComponent } from './import-tracking-list/import-tracking-list.component';
import { ImportTrackingDetailComponent } from './import-tracking-detail/import-tracking-detail.component';
import { ImportStatsComponent } from './import-stats/import-stats.component';

const routes: Routes = [
  {
    path: '',
    component: ImportTrackingListComponent
  },
  {
    path: 'stats',
    component: ImportStatsComponent
  },
  {
    path: ':id',
    component: ImportTrackingDetailComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ImportTrackingModule { }
