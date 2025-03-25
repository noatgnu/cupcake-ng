import { Component } from '@angular/core';
import {LoadingTrackerService} from "../loading-tracker.service";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-loading-indicator',
  imports: [
    AsyncPipe
  ],
  templateUrl: './loading-indicator.component.html',
  styleUrl: './loading-indicator.component.scss'
})
export class LoadingIndicatorComponent {
  loadingChunk = this.loadingTrackerService.loading$;

  constructor(private loadingTrackerService: LoadingTrackerService) {}

}
