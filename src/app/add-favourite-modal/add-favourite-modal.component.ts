import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {LabGroup, LabGroupQuery} from "../lab-group";
import {WebService} from "../web.service";

@Component({
  selector: 'app-add-favourite-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './add-favourite-modal.component.html',
  styleUrl: './add-favourite-modal.component.scss'
})
export class AddFavouriteModalComponent {
  selectedLabGroup: LabGroup|undefined = undefined
  private _name: string = '';
  @Input() set name(value: string) {
    this._name = value;
  }

  get name() {
    return this._name
  }

  private _type: string = '';
  @Input() set type(value: string) {
    this._type = value;
  }

  get type() {
    return this._type
  }

  private _value: string = '';
  @Input() set value(value: string) {
    this._value = value;
    this.form.controls.display_name.setValue(value)
  }

  get value() {
    return this._value
  }

  form = this.fb.group({
    display_name: [''],
    mode: [''],
    lab_group_search: [''],
  })

  labGroupQuery: LabGroupQuery|undefined = undefined

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {
    this.form.controls.lab_group_search.valueChanges.subscribe(value => {
      if (value) {
        let isProfessional = this.form.value.mode === 'service_lab_group'
        this.web.getUserLabGroups(value, 10, 0, isProfessional).subscribe(lab_groups => {
          this.labGroupQuery = lab_groups
        })
      }
    })
    this.form.controls.mode.valueChanges.subscribe(value => {
      if (value === 'service_lab_group' || value === 'lab_group') {
        let isProfessional = value === 'service_lab_group'
        this.web.getUserLabGroups(value, 10, 0, isProfessional).subscribe(lab_groups => {
          this.labGroupQuery = lab_groups
        })
      } else {
        this.labGroupQuery = undefined
        this.selectedLabGroup = undefined
      }
    })

  }

  close() {
    this.activeModal.dismiss();
  }

  submit() {
    if (this.selectedLabGroup) {
      this.activeModal.close({lab_group: this.selectedLabGroup.id, ...this.form.value})
    } else {
      this.activeModal.close({...this.form.value})
    }
  }

}
