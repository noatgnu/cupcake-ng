import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {ProtocolEditorComponent} from "./protocol-editor.component";

const routes: Routes = [
  {
    path: ':protocolID',
    component: ProtocolEditorComponent
  }
  ,
  {
    path: '',
    component: ProtocolEditorComponent
  }
]
@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class ProtocolEditorModule { }
