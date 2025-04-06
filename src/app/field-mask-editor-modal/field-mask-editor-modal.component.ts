import {Component, Input} from '@angular/core';
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet
} from "@ng-bootstrap/ng-bootstrap";
import {MetadataTableTemplate} from "../metadata-column";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-field-mask-editor-modal',
  imports: [
    NgbNav,
    NgbNavItem,
    NgbNavOutlet,
    ReactiveFormsModule,
    NgbNavLinkButton,
    NgbNavContent
  ],
  templateUrl: './field-mask-editor-modal.component.html',
  styleUrl: './field-mask-editor-modal.component.scss'
})
export class FieldMaskEditorModalComponent {
  private _template: MetadataTableTemplate|undefined = undefined;
  formArray: any[] = [];
  private maskNameMap: {[key: string]: string} = {};
  @Input() set template(value: MetadataTableTemplate) {
    this._template = value;
    for (const m of value.field_mask_mapping) {
      this.maskNameMap[m.name] = m.mask;
    }
    for (const column of value.user_columns) {
      const formGroup = this.fb.group({
        name: [column.name],
        mask: [""],
        type: ["user"]
      })
      if (this.maskNameMap[column.name]) {
        formGroup.controls.mask.setValue(this.maskNameMap[column.name]);
      }
      this.formArray.push(formGroup);
    }
    for (const column of value.staff_columns) {
      const formGroup = this.fb.group({
        name: [column.name],
        mask: [""],
        type: ["staff"]
      })
      if (this.maskNameMap[column.name]) {
        formGroup.controls.mask.setValue(this.maskNameMap[column.name]);
      }
      this.formArray.push(formGroup);
    }
  }

  get template(): MetadataTableTemplate|undefined {
    return this._template;
  }

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {

  }

  close() {
    this.activeModal.close();
  }

  save() {
    // Save the template
    const data = this.formArray.filter((form) => form.value.mask !== "" && form.value.mask !== null).map((form) => {
      return {
        name: form.value.name,
        mask: form.value.mask,
      }
    })
    this.activeModal.close(data);
  }

}
