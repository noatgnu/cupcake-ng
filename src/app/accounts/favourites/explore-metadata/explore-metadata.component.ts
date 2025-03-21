import { Component } from '@angular/core';
import {
  JobMetadataCreationModalComponent
} from "../../../instruments/instrument-job-management/job-metadata-creation-modal/job-metadata-creation-modal.component";

@Component({
  selector: 'app-explore-metadata',
  imports: [
    JobMetadataCreationModalComponent
  ],
  templateUrl: './explore-metadata.component.html',
  styleUrl: './explore-metadata.component.scss'
})
export class ExploreMetadataComponent {
  constructor() { }

}
