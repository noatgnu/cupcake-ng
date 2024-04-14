import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {SessionEditorComponent} from "./session-editor.component";

const routes: Routes = [
  {
    path: ':sessionID',
    component: SessionEditorComponent
  },
  {
    path: '',
    component: SessionEditorComponent
  }
  ]

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class SessionEditorModule { }
