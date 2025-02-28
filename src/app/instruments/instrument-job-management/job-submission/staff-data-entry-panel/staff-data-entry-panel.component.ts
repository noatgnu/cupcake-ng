import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveOffcanvas} from "@ng-bootstrap/ng-bootstrap";
import {InstrumentJob} from "../../../../instrument-job";

@Component({
  selector: 'app-staff-data-entry-panel',
  standalone: true,
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
      injection_volume: value.injection_volume,
      injection_unit: value.injection_unit,
      search_engine: value.search_engine,
      search_engine_version: value.search_engine_version,
      search_details: value.search_details,
      location: value.location,
    })
  }

  staffDataForm = this.fb.group({
    injection_volume: [0],
    injection_unit: ['uL'],
    search_engine: ['DIANN'],
    search_engine_version: [''],
    search_details: [''],
    location: [''],
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
