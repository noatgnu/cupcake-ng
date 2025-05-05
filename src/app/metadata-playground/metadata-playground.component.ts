import { Component } from '@angular/core';
import {WebService} from "../web.service";
import {MetadataService} from "../metadata.service";
import {LabGroup, LabGroupQuery} from "../lab-group";
import {FormArray, FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MetadataColumn, MetadataTableTemplate, MetadataTableTemplateQuery} from "../metadata-column";
import {
  NgbAlert,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle, NgbModal,
  NgbPagination, NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {
  MetadataTableComponent
} from "../instruments/instrument-job-management/job-submission/metadata-table/metadata-table.component";
import {
  JobMetadataCreationModalComponent
} from "../instruments/instrument-job-management/job-metadata-creation-modal/job-metadata-creation-modal.component";
import {
  SdrfValidationResultsModalComponent
} from "../instruments/instrument-job-management/job-submission/sdrf-validation-results-modal/sdrf-validation-results-modal.component";
import {ToastService} from "../toast.service";
import {FieldMaskEditorModalComponent} from "../field-mask-editor-modal/field-mask-editor-modal.component";

@Component({
  selector: 'app-metadata-playground',
  imports: [
    ReactiveFormsModule,
    NgbPagination,
    MetadataTableComponent,
    FormsModule,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbAlert,
    NgbTooltip,
  ],
  templateUrl: './metadata-playground.component.html',
  styleUrl: './metadata-playground.component.scss'
})
export class MetadataPlaygroundComponent {
  currentToast: any;
  professionalLabGroupQuery: LabGroupQuery|undefined = undefined;
  professionalLabGroupPage = 1
  professionalLabGroupPageSize = 5
  selectedLabGroup: LabGroup|undefined = undefined;
  form = this.fb.group({
    searchTerm: [""],
    lab_group_id: [0],
    searchTableTerm: [""],
    sample_number: [10],
    show_hidden: this.fb.control<boolean>(false),
    injection_volume: [0],
  })

  metadataTableTemplateQuery: MetadataTableTemplateQuery|undefined = undefined;
  metadataTableTemplatePage = 1
  metadataTableTemplatePageSize = 5

  labGroupMap: { [key: number]: LabGroup } = {};
  selectedRow: MetadataTableTemplate|undefined = undefined ;
  missingColumns: string[] = [];
  searchColumn: string = "";

  constructor(private toast: ToastService, private modal: NgbModal, private web: WebService, public metadata: MetadataService, private fb: FormBuilder) {
    this.getLabGroups()
    this.form.controls.lab_group_id.valueChanges.subscribe(
      (value) => {
        this.professionalLabGroupPage = 1
        if (value) {
          if (this.professionalLabGroupQuery) {
            this.selectedLabGroup = this.professionalLabGroupQuery.results.find((labGroup) => labGroup.id === value)
          }
          this.getTemplates(this.form.controls.searchTableTerm.value, value)
        }
      }
    )
  }

  getLabGroups(value: string|undefined|null = undefined) {
    const offset = (this.professionalLabGroupPage - 1) * this.professionalLabGroupPageSize;
    // @ts-ignore
    this.web.getLabGroups(value, this.professionalLabGroupPage, offset, true).subscribe(
      (data: LabGroupQuery) => {
        this.professionalLabGroupQuery = data;
      }
    )

  }

  labGroupPageChange(page: number) {
    this.professionalLabGroupPage = page;
    this.getLabGroups(this.form.controls.searchTerm.value);
  }

  getTemplates(value: string|undefined|null = undefined, lab_group_id: number|undefined|null = undefined) {
    const offset = (this.metadataTableTemplatePage - 1) * this.metadataTableTemplatePageSize;

    if (lab_group_id && lab_group_id > 0) {
      this.web.getMetadataTableTemplates(this.metadataTableTemplatePageSize, offset, value, 'service_lab_group', lab_group_id, false).subscribe(
        (data: MetadataTableTemplateQuery) => {
          this.metadataTableTemplateQuery = data;
        }
      )
    } else {
      this.web.getMetadataTableTemplates(this.metadataTableTemplatePageSize, offset, value, undefined, undefined, false).subscribe(
        (data: MetadataTableTemplateQuery) => {
          this.metadataTableTemplateQuery = data;
        }
      )
    }
  }

  metadataTableTemplatePageChange(page: number) {
    this.metadataTableTemplatePage = page;
    this.getTemplates(this.form.controls.searchTableTerm.value, this.form.controls.lab_group_id.value);
  }

  selectRow(row: MetadataTableTemplate) {
    this.selectedRow = row;
    this.missingColumns = this.metadata.checkMissingColumnMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns)
  }

  handleMetadataUpdate(event: {
    name:string,
    value: string,
    type: string,
    id: number,
    hidden: boolean,
    readonly : boolean,
    data_type: string,
    modifiers: {samples: string, value: string}[]
  }[], arrayName: 'user_metadata'|'staff_metadata'|undefined|null = undefined) {
    console.log(event)
    let highestID = 0;

    if (this.selectedRow) {
      this.selectedRow.user_columns.forEach(user => {
        if (user.id > highestID) {
          highestID = user.id;
        }
      })
      this.selectedRow.staff_columns.forEach(staff => {
        if (staff.id > highestID) {
          highestID = staff.id;
        }
      })
      for (const e of event) {
        if (arrayName) {
          let metadataColumn: MetadataColumn = {
            name: e.name,
            type: e.type,
            column_position: 0,
            value: e.value,
            stored_reagent: null,
            id: highestID + 1,
            created_at: new Date(),
            updated_at: new Date(),
            not_applicable: false,
            mandatory: false,
            modifiers: e.modifiers,
            hidden: e.hidden,
            auto_generated: false,
            readonly: e.readonly,
          }
          if (arrayName === 'user_metadata') {
            this.selectedRow.user_columns.push(metadataColumn);
            this.selectedRow.user_columns = [...this.selectedRow.user_columns];
          } else {
            this.selectedRow.staff_columns.push(metadataColumn);
            this.selectedRow.staff_columns = [...this.selectedRow.staff_columns];
          }
          console.log(metadataColumn);
          highestID++
        } else {
          const userColumn = this.selectedRow.user_columns.find((column) => column.id === e.id);
          if (userColumn) {
            userColumn.hidden = e.hidden;
            userColumn.readonly = e.readonly;
            userColumn.value = e.value;
            if (!e.modifiers) {
              e.modifiers = [];
            }
            userColumn.modifiers = e.modifiers;
            this.selectedRow.user_columns = [...this.selectedRow.user_columns];
          } else {
            const staffColumn = this.selectedRow.staff_columns.find((column) => column.id === e.id);
            if (staffColumn) {
              staffColumn.hidden = e.hidden;
              staffColumn.readonly = e.readonly;
              staffColumn.value = e.value;
              if (!e.modifiers) {
                e.modifiers = [];
              }
              staffColumn.modifiers = e.modifiers;
              this.selectedRow.staff_columns = [...this.selectedRow.staff_columns];
            }
          }
        }
      }
      console.log(this.selectedRow.user_columns, this.selectedRow.staff_columns);
      this.missingColumns = this.metadata.checkMissingColumnMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns)
      // calculate hidden columns
      this.recalculateHiddenColumns()
    }
  }

  recalculateHiddenColumns() {
    if (this.selectedRow) {
      this.selectedRow.hidden_staff_columns = this.selectedRow.staff_columns.reduce( (acc, column) => { return acc + (column.hidden ? 1 : 0) }, 0)
      this.selectedRow.hidden_user_columns = this.selectedRow.user_columns.reduce( (acc, column) => { return acc + (column.hidden ? 1 : 0) }, 0)
    }
  }

  async exportExcelTemplate() {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.lab_group_id) {
      const wb = await this.metadata.convert_metadata_to_excel(this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id, this.selectedRow.field_mask_mapping)
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exported.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  async importSDRFFile(e: Event) {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.lab_group_id) {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        if (e.target) {
          reader.onload = async (e) => {
            if (e.target) {
              const data = e.target.result;
              if (this.selectedRow) {
                // @ts-ignore
                const result = await this.metadata.import_metadata_from_sdrf(data as string, this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id);
                this.selectedRow.user_columns = result.user_metadata;
                this.selectedRow.staff_columns = result.staff_metadata;
                this.missingColumns = this.metadata.checkMissingColumnMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns);
                this.recalculateHiddenColumns();
              }
            }
          }
          reader.readAsText(file);
        }
      }
    }
  }

  importExcelTemplate(e: Event) {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.lab_group_id) {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        if (e.target) {
          reader.onload = async (e) => {
            if (e.target) {
              const data = e.target.result;
              if (this.selectedRow) {
                // @ts-ignore
                const result = await this.metadata.read_metadata_from_excel(data as ArrayBuffer, this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id, this.selectedRow.field_mask_mapping);
                this.selectedRow.user_columns =result.user_metadata;
                this.selectedRow.staff_columns = result.staff_metadata;
                this.missingColumns = this.metadata.checkMissingColumnMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns);
                this.recalculateHiddenColumns();
              }
            }
          }
          reader.readAsArrayBuffer(file);
        }

      }
    }
  }

  async exportMetadataSDRF() {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.lab_group_id) {
      const sdrf = await this.metadata.export_metadata_to_sdrf(this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id)
      const textContent = sdrf.map((row) => row.join("\t")).join("\n");
      const blob = new Blob([textContent], {type: 'text/plain'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exported.sdrf.tsv`;
      a.click();
      window.URL.revokeObjectURL(url);

    }
  }

  async validateMetadata() {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.lab_group_id) {
      this.currentToast = await this.toast.show("Validation", "Validating metadata", 0, "info", 5)
      const errors = await this.metadata.validateMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id);
      this.currentToast.progress = 100;
      if (errors) {
        if (errors.errors.length > 0) {
          const ref = this.modal.open(SdrfValidationResultsModalComponent, {scrollable: true})
          ref.componentInstance.errors = errors.errors;
        } else {
          await this.toast.show("Validation", "No errors found", 2000, "success")
        }
      } else {
        await this.toast.show("Validation", "No errors found", 2000, "success")
      }
      this.toast.remove(this.currentToast);
      this.currentToast = undefined;
    }
  }

  addMetadata(metadata: {name: string, type: string}, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    ref.componentInstance.previewMode = true
    if (this.selectedRow) {
      if (this.form.value.lab_group_id){
        ref.componentInstance.service_lab_group_id = this.form.value.lab_group_id
        if (metadata.type === "Factor value") {
          ref.componentInstance.possibleColumns = [...this.selectedRow.user_columns, ...this.selectedRow.staff_columns].filter((m) => m.type !== "Factor value")
        }
      }
      ref.componentInstance.name = metadata.name
      // capitalize first letter
      ref.componentInstance.type = metadata.type.charAt(0).toUpperCase() + metadata.type.slice(1)
      ref.closed.subscribe((result: any[]) => {
        const meta: {
          name: string,
          value: string,
          type: string,
          id: number,
          data_type: string,
          hidden: boolean,
          readonly: boolean,
          modifiers: {samples: string, value: string}[]
        }[] = []
        for (const r of result) {
          let value = r.metadataValue
          value = this.metadata.tranformMetadataValue(r, value);
          meta.push({
            name: r.metadataName,
            value: value,
            type: r.metadataType,
            modifiers: [],
            data_type: arrayName,
            hidden: r.hidden,
            readonly: r.readonly,
            id: 0
          })
        }
        this.handleMetadataUpdate(meta, arrayName);
      })
    }
  }

  removeMetadata(event: { metadata: MetadataColumn, index: number, data_type: 'user_metadata'|'staff_metadata' }) {
    if (this.selectedRow) {
      if (event.data_type === 'user_metadata') {
        this.selectedRow.user_columns.splice(event.index, 1);
        this.selectedRow.user_columns = [...this.selectedRow.user_columns];
      } else {
        this.selectedRow.staff_columns.splice(event.index, 1);
        this.selectedRow.staff_columns = [...this.selectedRow.staff_columns];
      }
      this.missingColumns = this.metadata.checkMissingColumnMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns)
      this.recalculateHiddenColumns()
    }
  }

  exportFile(file_type: string) {
    if (this.selectedRow && this.form.value.sample_number) {
      if (file_type === "injection") {

        if (this.form.value.injection_volume) {
          let dataFileCol = this.selectedRow.user_columns.find((m) => m.name === "Data file")
          if (!dataFileCol) {
            dataFileCol = this.selectedRow.staff_columns.find((m) => m.name === "Data file")
          }
          let positionCol = this.selectedRow.user_columns.find((m) => m.name === "Position")
          if (!positionCol) {
            positionCol = this.selectedRow.staff_columns.find((m) => m.name === "Position")
          }
          if (dataFileCol && positionCol) {
            const result = this.metadata.convertInjectionFile(dataFileCol, positionCol, this.form.value.injection_volume, this.form.value.sample_number)
            // download file
            const blob = new Blob([result], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'injection_list.tsv';
            a.click();
            window.URL.revokeObjectURL(url);
          } else {
            if (!dataFileCol) {
              this.toast.show("Injection List", "Data file column not found")
            }
            if (!positionCol) {
              this.toast.show("Injection List", "Position column not found")
            }
          }
        } else {
          this.toast.show("Injection List", "Injection volume not set")
        }
      }
    }

  }
  openFieldMaskEditorModal() {
    if (this.selectedRow) {
      const ref = this.modal.open(FieldMaskEditorModalComponent, {scrollable: true})
      ref.componentInstance.template = this.selectedRow
      ref.result.then((result) => {
        if (result && this.selectedRow) {
          this.selectedRow.field_mask_mapping = result
        }
      })
    }
  }
}
