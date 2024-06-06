import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {ReagentStoreComponent} from "./reagent-store.component";

const routes: Routes = [
  {
    path: '',
    component: ReagentStoreComponent,
  },
  {
    path: ':storageID',
    component: ReagentStoreComponent,
  }
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class ReagentStoreModule { }
