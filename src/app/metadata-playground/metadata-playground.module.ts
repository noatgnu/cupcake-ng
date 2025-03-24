import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {MetadataPlaygroundComponent} from "./metadata-playground.component";

const routes: Routes = [
  {
    component: MetadataPlaygroundComponent,
    path: ""
  }

  ]

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class MetadataPlaygroundModule { }
