import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {ProtocolSessionComponent} from "./protocol-session.component";

const routes: Routes = [
  {
    path: ':protocolSessionId',
    component: ProtocolSessionComponent,
    children: [
      {
        path: 'session/:sessionId',
        component: ProtocolSessionComponent,
        children: [
          {
            path: 'section/:sectionId',
            component: ProtocolSessionComponent
          },
          {
            path: 'section/:sectionId/step/:stepId',
            component: ProtocolSessionComponent
          },
          {
            path: 'folder/:folderId',
            component: ProtocolSessionComponent
          },
          {
            path: '',
            component: ProtocolSessionComponent
          }
        ]
      },
      {
        path: 'section/:sectionId',
        component: ProtocolSessionComponent
      },
      {
        path: 'section/:sectionId/step/:stepId',
        component: ProtocolSessionComponent
      },
      {
        path: '',
        component: ProtocolSessionComponent
      }
    ]
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ]
})
export class ProtocolSessionModule { }
