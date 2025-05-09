import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-reagent-import-file-format-instructions',
  imports: [],
  templateUrl: './reagent-import-file-format-instructions.component.html',
  styleUrl: './reagent-import-file-format-instructions.component.scss'
})
export class ReagentImportFileFormatInstructionsComponent {

  constructor(public modal: NgbActiveModal) {}

}
