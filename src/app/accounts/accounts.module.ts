import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {AccountsComponent} from "./accounts.component";

const routes: Routes = [
  {
    path: '',
    component: AccountsComponent,
  },
  {
    path: ':section',
    component: AccountsComponent,
  },
  {
    path: ':section/:token',
    component: AccountsComponent,
  }
  ]

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class AccountsModule { }
