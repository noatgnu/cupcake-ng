import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveOffcanvas} from "@ng-bootstrap/ng-bootstrap";
import {InstrumentJob} from "../../../../instrument-job";

@Component({
    selector: 'app-staff-data-entry-panel',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './staff-data-entry-panel.component.html',
    styleUrl: './staff-data-entry-panel.component.scss'
})
export class StaffDataEntryPanelComponent {
  private _job: InstrumentJob|undefined

  @Input() set job(value: InstrumentJob) {
    this._job = value
    this.staffDataForm.patchValue({
      status: value.status
    })
  }

  get job(): InstrumentJob {
    return this._job!
  }

  staffDataForm = this.fb.group({
    status: [''],
  });

  constructor(private fb: FormBuilder, private activeCanvas: NgbActiveOffcanvas) {}

  ngOnInit(): void {

  }

  close(): void {
    this.activeCanvas.dismiss();
  }

  save(): void {
    if (this.staffDataForm.valid) {
      this.activeCanvas.close(this.staffDataForm.value);
    }
  }
}
