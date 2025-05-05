import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {InstrumentsComponent} from "./instruments.component";
import {InstrumentJobManagementComponent} from "./instrument-job-management/instrument-job-management.component";
import {InstrumentMaintenanceLogsComponent} from "./instrument-management/instrument-maintenance-logs/instrument-maintenance-logs.component";

const routes: Routes = [
  {
    path: '',
    component: InstrumentsComponent,
  },
  {
    path: ':instrumentId/maintenance-logs',
    component: InstrumentMaintenanceLogsComponent
  },
  {
    path: ':section',
    component: InstrumentsComponent
  },
  {
    path: ':section/:id',
    component: InstrumentsComponent
  },
  ]


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class InstrumentsModule { }
