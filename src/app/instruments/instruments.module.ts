import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {InstrumentsComponent} from "./instruments.component";

const routes: Routes = [
  {
    path: '',
    component: InstrumentsComponent
  }
  ]


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class InstrumentsModule { }
