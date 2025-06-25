import { Routes } from '@angular/router';
import {MetadataPlaygroundModule} from "./metadata-playground/metadata-playground.module";
import {ReagentStoreModule} from "./reagent-store/reagent-store.module";
import {InstrumentsModule} from "./instruments/instruments.module";
import {ProjectEditorModule} from "./project-editor/project-editor.module";
import {CalendarModule} from "./calendar/calendar.module";
import {SessionEditorModule} from "./session-editor/session-editor.module";
import {AccountsModule} from "./accounts/accounts.module";
import {ProtocolEditorModule} from "./protocol-editor/protocol-editor.module";
import {ProtocolSessionModule} from "./protocol-session/protocol-session.module";
import {HomeModule} from "./home/home.module";
import {SiteSettingsComponent} from "./site-settings/site-settings.component";

export const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => HomeModule
  },
  {
    path: 'protocol-session',
    loadChildren: () => ProtocolSessionModule
  },
  {
    path: 'protocol-editor',
    loadChildren: () => ProtocolEditorModule
  },
  {
    path: 'accounts',
    loadChildren: () => AccountsModule
  },
  {
    path: 'session-editor',
    loadChildren: () => SessionEditorModule
  },
  {
    path: 'calendar',
    loadChildren: () => CalendarModule
  },
  {
    path: 'project-editor',
    loadChildren: () => ProjectEditorModule
  },
  {
    path: 'instruments',
    loadChildren: () => InstrumentsModule
  },
  {
    path: 'reagent-store',
    loadChildren: () => ReagentStoreModule
  }
  ,
  {
    path: 'sdrf-playground',
    loadChildren: () => MetadataPlaygroundModule
  },
  {
    path: 'site-settings',
    component: SiteSettingsComponent
  },
  {
    path: '**',
    redirectTo: 'home'
  },


];
