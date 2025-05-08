import {Component, Input, OnInit} from '@angular/core';
import {ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-action-export-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './action-export-modal.component.html',
  styleUrl: './action-export-modal.component.scss'
})
export class ActionExportModalComponent implements OnInit{
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();

  form = this.fb.group({
    startDate: new FormControl('', Validators.required),
    endDate: new FormControl('', Validators.required)
  });

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.form.controls.startDate.setValue(this.formatDateForInput(this.startDate));
    this.form.controls.endDate.setValue(this.formatDateForInput(this.endDate));
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  export() {
    if (this.form.valid) {
      this.activeModal.close({
        startDate: new Date(this.form.controls.startDate.value!),
        endDate: new Date(this.form.controls.endDate.value!)
      });
    }
  }
}
