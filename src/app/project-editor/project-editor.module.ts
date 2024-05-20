import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {ProjectEditorComponent} from "./project-editor.component";

const routes: Routes = [
  {
    path: ':projectID',
    component: ProjectEditorComponent
  },
  {
    path: '',
    component: ProjectEditorComponent
  }
  ]


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class ProjectEditorModule { }
