import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {BrowserComponent} from "./browser/browser.component";

const routes: Routes = [
  {
    path: 'browser',
    component: BrowserComponent
  }

]

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class SharedDocumentsModule { }
