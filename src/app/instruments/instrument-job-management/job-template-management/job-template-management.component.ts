import { Component } from '@angular/core';
import {AccountsService} from "../../../accounts/accounts.service";
import {LabGroupQuery} from "../../../lab-group";
import {WebService} from "../../../web.service";
import {FormArray, FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  NgbAlert,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle, NgbModal, NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkButton, NgbNavOutlet,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {MetadataColumn, MetadataTableTemplate, MetadataTableTemplateQuery} from "../../../metadata-column";
import {ToastService} from "../../../toast.service";
import {JobTemplateCreationModalComponent} from "./job-template-creation-modal/job-template-creation-modal.component";
import {MetadataTableComponent} from "../job-submission/metadata-table/metadata-table.component";
import {MetadataService} from "../../../metadata.service";
import {JobMetadataCreationModalComponent} from "../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {FieldMaskEditorModalComponent} from "../../../field-mask-editor-modal/field-mask-editor-modal.component";

@Component({
  selector: 'app-job-template-management',
  imports: [
    ReactiveFormsModule,
    NgbPagination,
    MetadataTableComponent,
    FormsModule,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNavOutlet,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbTooltip,
    NgbAlert
  ],
  templateUrl: './job-template-management.component.html',
  styleUrl: './job-template-management.component.scss'
})
export class JobTemplateManagementComponent {
  activeTab = 'user'
  templateShowHidden: boolean = false
  userLabGroupQuery: LabGroupQuery|undefined;
  tableTemplateQuery: MetadataTableTemplateQuery|undefined;
  labGroupForm = this.fb.group({
    searchTerm: [''],
    lab_group_id: [0]
  })
  tableTemplateForm = this.fb.group({
    searchTerm: [''],
  })
  labGroupPageSize: number = 5
  labGroupPage: number = 1
  tableTemplatePageSize: number = 5
  tableTemplatePage: number = 1

  missingColumns: string[] = []

  private _selectedTemplate: MetadataTableTemplate|undefined

  set selectedTemplate(value: MetadataTableTemplate|undefined) {
    this._selectedTemplate = value
    this.missingColumns = []
    if (value) {
      const userColumnNames = value.user_columns.map(column => column.name)
      const staffColumnNames = value.staff_columns.map(column => column.name)
      for (const n of this.metadataService.requiredColumnNames) {
        if (!userColumnNames.includes(n) && !staffColumnNames.includes(n)) {
          this.missingColumns.push(n)
        }
      }
    }

  }

  get selectedTemplate(): MetadataTableTemplate {
    return this._selectedTemplate!
  }

  constructor(public metadataService: MetadataService, private accounts: AccountsService, private web: WebService, private fb: FormBuilder, private toast: ToastService, private modal: NgbModal) { }

  ngOnInit() {
    this.web.getUserLabGroups(undefined, this.labGroupPageSize, 0, true).subscribe(data => {
      this.userLabGroupQuery = data;
    })
    this.labGroupForm.controls.lab_group_id.valueChanges.subscribe((value) => {
      this.getTableTemplate(value)
    })
    this.getTableTemplate()
  }

  onPageChange(page: number) {
    const offset = (page - 1) * this.labGroupPageSize;
    this.web.getUserLabGroups(undefined, this.labGroupPageSize, offset, true).subscribe(data => {
      this.userLabGroupQuery = data;
    })
  }

  getTableTemplate(lab_group_id: number|undefined|null = undefined) {
    const offset = (this.tableTemplatePage - 1) * this.tableTemplatePageSize;
    let mode = "user"
    console.log(lab_group_id)
    if (lab_group_id === undefined || lab_group_id === null) {
      if (this.labGroupForm.value.lab_group_id && this.labGroupForm.value.lab_group_id > 0) {
        mode = "service_lab_group"
        this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.tableTemplateForm.value.searchTerm, mode, this.labGroupForm.value.lab_group_id).subscribe(data => {
          this.tableTemplateQuery = data;
        })
      } else {
        mode = "user"
        this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.tableTemplateForm.value.searchTerm, mode).subscribe(data => {
          this.tableTemplateQuery = data;
        })
      }
    } else {
      if (lab_group_id > 0){
        mode = "service_lab_group"
        this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.tableTemplateForm.value.searchTerm, mode, lab_group_id).subscribe(data => {
          this.tableTemplateQuery = data;
        })
      } else {
        console.log(lab_group_id)
        mode = "user"
        this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.tableTemplateForm.value.searchTerm, mode).subscribe(data => {
          this.tableTemplateQuery = data;
        })
      }
    }
  }

  onTableTemplatePageChange(page: number) {
    this.tableTemplatePage = page;
    this.getTableTemplate();
  }

  createNewTemplate(mode: string) {
    const payload: any = {
      mode: mode,
    }
    if (mode === "service_lab_group") {
      if (this.labGroupForm.value.lab_group_id) {
        if (this.labGroupForm.value.lab_group_id > 0) {
          payload["lab_group"] = this.labGroupForm.value.lab_group_id
        } else{
          this.toast.show("Template Create","Please select a lab group")
          return
        }
      } else{
        this.toast.show("Template Create","Please select a lab_group")
        return
      }
    } else {
      this.labGroupForm.controls.lab_group_id.setValue(0)
    }
    const ref = this.modal.open(JobTemplateCreationModalComponent)
    ref.result.then(result => {
      if (result) {
        payload["name"] = result.name
        payload["make_default"] = true
        this.web.createMetadataTableTemplate(payload).subscribe(data => {
          this.selectedTemplate = data
          this.getTableTemplate()
        })
      }
    })
  }

  deleteTemplate(template: MetadataTableTemplate) {
    this.web.deleteMetadataTableTemplate(template.id).subscribe(data => {
      this.getTableTemplate()
    })
  }

  async updateMetadataTemplate(data: any[]) {
    if (this.selectedTemplate) {
      if (data.length === 0) {
        return
      }
      for (const c of this.selectedTemplate.user_columns) {
        for (const d of data) {
          if (c.id === d.id) {
            c.value = d.value
            c.mandatory = d.mandatory
            c.hidden = d.hidden
            c.auto_generated = d.auto_generated
            c.readonly = d.readonly
            c.mandatory = d.mandatory
          }
        }
      }
      for (const c of this.selectedTemplate.staff_columns) {
        for (const d of data) {
          if (c.id === d.id) {
            c.value = d.value
            c.mandatory = d.mandatory
            c.hidden = d.hidden
            c.auto_generated = d.auto_generated
            c.readonly = d.readonly
            c.mandatory = d.mandatory
          }
        }
      }
      const result = await this.web.updateMetadataTableTemplate(this.selectedTemplate.id, this.selectedTemplate).toPromise()
      if (result) {
        this.selectedTemplate = result
        if (this.tableTemplateQuery && this.selectedTemplate) {
          // @ts-ignore
          const d = this.tableTemplateQuery.results.findIndex((c) => c.id === this.selectedTemplate.id)
          if (d >= 0) {
            this.tableTemplateQuery.results[d] = this.selectedTemplate
          }
        }
      }
    }
  }

  changeActiveID(id: string) {
    if (id==="user") {
      this.labGroupForm.controls.lab_group_id.setValue(0)
      this.tableTemplateQuery = undefined;
      this.selectedTemplate = undefined;
      this.getTableTemplate()
    } else {
      this.tableTemplateQuery = undefined;
      this.selectedTemplate = undefined;
    }
  }

  addMetadata(metadata: {name: string, type: string}, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    if (this.selectedTemplate) {
      if (metadata.type === "Factor value") {
        ref.componentInstance.possibleColumns = [...this.selectedTemplate.user_columns, ...this.selectedTemplate.staff_columns].filter((m) => m.type !== "Factor value")
      }
    }
    ref.componentInstance.name = metadata.name
    // capitalize first letter
    ref.componentInstance.type = metadata.type.charAt(0).toUpperCase() + metadata.type.slice(1)


    ref.closed.subscribe((result: any[]) => {
      if (result) {
        const payload: any[] = []
        for (const r of result) {
          if (r.type !== 'Factor value') {
            if (r.charateristic) {
              r.metadataType = "Characteristics"
            } else {
              r.metadataType = "Comment"
            }

            let group: any = {
              name: r.metadataName,
              type: r.metadataType,
              value: r.metadataValue,
              mandatory: false,
              id: null,
              readonly: r.readonly,
              auto_generated: r.auto_generated,
              modifiers: [],
              hidden: r.hidden,
            }
            group.value = this.metadataService.tranformMetadataValue(r, r.metadataValue);
            payload.push(group)
          } else {
            if (this.selectedTemplate) {
              const selectedFactorValueColumn = [...this.selectedTemplate.user_columns, ...this.selectedTemplate.staff_columns].find((c: MetadataColumn) => c.name === r.metadataValue && c.type !== "Factor value")
              if (selectedFactorValueColumn) {
                let group: any = {
                  name: selectedFactorValueColumn.name,
                  type: 'Factor value',
                  value: selectedFactorValueColumn.value,
                  mandatory: false,
                  id: null,
                  modifiers: selectedFactorValueColumn.modifiers,
                  readonly: r.readonly,
                  auto_generated: r.auto_generated,
                  hidden: r.hidden,
                }
                group.value = this.metadataService.tranformMetadataValue(r, selectedFactorValueColumn.value);
                payload.push(group)
              }
            }
          }
        }
        console.log(payload)
        if (payload.length > 0) {
          if (this.selectedTemplate) {
            if (arrayName === 'user_metadata') {
              this.selectedTemplate.user_columns = [...this.selectedTemplate.user_columns, ...payload]
            } else {
              this.selectedTemplate.staff_columns = [...this.selectedTemplate.staff_columns, ...payload]
            }
            this.web.updateMetadataTableTemplate(this.selectedTemplate.id, this.selectedTemplate).subscribe(data => {
              this.selectedTemplate = data;
              if (this.tableTemplateQuery && this.selectedTemplate) {
                // @ts-ignore
                const d = this.tableTemplateQuery.results.findIndex((c) => c.id === this.selectedTemplate.id)
                if (d >= 0) {
                  this.tableTemplateQuery.results[d] = this.selectedTemplate
                }
              }
            })
          }

        }
      }
    })
  }

  exportTemplateToJSON(metadataTemplate: MetadataTableTemplate) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metadataTemplate));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", metadataTemplate.name + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file: File = (target.files as FileList)[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target) {
          return;
        }
        const contents = e.target.result;
        if (contents) {
          const data = JSON.parse(contents as string);
          const user_columns = data.user_columns.map((c: any) => {
            c.id = null
            return c
          });
          const staff_columns = data.staff_columns.map((c: any) => {
            c.id = null
            return c
          });
          if (this.selectedTemplate) {
            this.selectedTemplate.user_columns = user_columns;
            this.selectedTemplate.staff_columns = staff_columns;
            this.web.updateMetadataTableTemplate(this.selectedTemplate.id, this.selectedTemplate).subscribe(data => {
              this.selectedTemplate = data;
              if (this.tableTemplateQuery && this.selectedTemplate) {
                // @ts-ignore
                const d = this.tableTemplateQuery.results.findIndex((c) => c.id === this.selectedTemplate.id)
                if (d >= 0) {
                  this.tableTemplateQuery.results[d] = this.selectedTemplate
                }
              }
            })
          }

        }
      }
      reader.readAsText(file);
    }
    input.click();
  }

  openFieldMaskEditorModal() {
    if (this.selectedTemplate) {
      const ref = this.modal.open(FieldMaskEditorModalComponent, {scrollable: true})
      ref.componentInstance.template = this.selectedTemplate
      ref.result.then((result) => {
        if (result && this.selectedTemplate) {
          this.selectedTemplate.field_mask_mapping = result
          this.web.updateMetadataTableTemplate(this.selectedTemplate.id, {field_mask_mapping: result}).subscribe(data => {
            this.selectedTemplate = data;
            this.toast.show("Field Mask Editor", "Field mask mapping updated successfully")
          })
        }
      })
    }
  }
}
