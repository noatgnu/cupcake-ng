import { Component } from '@angular/core';
import {AccountsService} from "../../../accounts/accounts.service";
import {LabGroupQuery} from "../../../lab-group";
import {WebService} from "../../../web.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle, NgbModal, NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkButton, NgbNavOutlet,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {MetadataTableTemplate, MetadataTableTemplateQuery} from "../../../metadata-column";
import {ToastService} from "../../../toast.service";
import {JobTemplateCreationModalComponent} from "./job-template-creation-modal/job-template-creation-modal.component";
import {MetadataTableComponent} from "../job-submission/metadata-table/metadata-table.component";

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
    NgbNavOutlet
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

  selectedTemplate: MetadataTableTemplate | undefined

  constructor(private accounts: AccountsService, private web: WebService, private fb: FormBuilder, private toast: ToastService, private modal: NgbModal) { }

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
}
