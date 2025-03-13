import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MetadataTableTemplate, MetadataTableTemplateQuery} from "../metadata-column";
import {WebService} from "../web.service";
import {FormBuilder, FormsModule} from "@angular/forms";
import {NgbPagination} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-metadata-template-selection',
  imports: [
    FormsModule,
    NgbPagination
  ],
  templateUrl: './metadata-template-selection.component.html',
  styleUrl: './metadata-template-selection.component.scss'
})
export class MetadataTemplateSelectionComponent {
  @Output() selected: EventEmitter<MetadataTableTemplate> = new EventEmitter<MetadataTableTemplate>()
  private _metadataTableTemplateQuery: MetadataTableTemplateQuery|undefined

  set metadataTableTemplateQuery(metadataTableTemplateQuery: MetadataTableTemplateQuery) {
    this._metadataTableTemplateQuery = metadataTableTemplateQuery
    this.selectedTemplateMap = {}
    for (const m of metadataTableTemplateQuery.results) {
      this.selectedTemplateMap[m.id] = null
    }
  }

  get metadataTableTemplateQuery(): MetadataTableTemplateQuery {
    return this._metadataTableTemplateQuery!
  }

  private _lab_group_id: number|undefined

  @Input() set lab_group_id(value: number) {
    this._lab_group_id = value;
    this.getTableTemplates(value)
  }

  selectedTemplateMap: any = {}

  get lab_group_id(): number {
    return this._lab_group_id!;
  }

  tableTemplatePageSize = 5
  tableTemplatePage = 1

  form = this.fb.group({
    searchTerm: [''],
  })

  constructor(private web: WebService, private fb :FormBuilder) {
    this.getTableTemplates(0)
  }

  getTableTemplates(lab_group_id: number|null|undefined) {
    const offset = (this.tableTemplatePage - 1) * this.tableTemplatePageSize
    if (lab_group_id !== undefined && lab_group_id !== null) {
      if (lab_group_id > 0) {
        this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.form.value.searchTerm, 'service_lab_group', lab_group_id).subscribe(data => {
          this.metadataTableTemplateQuery = data
        })
      } else {
        this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.form.value.searchTerm, 'user').subscribe(data => {
          this.metadataTableTemplateQuery = data
        })
      }
    } else {
      this.web.getMetadataTableTemplates(this.tableTemplatePageSize, offset, this.form.value.searchTerm, 'user').subscribe(data => {
        this.metadataTableTemplateQuery = data
      })
    }
  }

  selectTemplate(template: MetadataTableTemplate) {
    this.selectedTemplateMap[template.id] = !this.selectedTemplateMap[template.id]
  }

  handleValueChange(event: any, template: MetadataTableTemplate) {

    for (const m in this.selectedTemplateMap) {
      if (parseInt(m) !== template.id) {
        this.selectedTemplateMap[m] = null
      }
    }
    this.selected.emit(template)
  }

  handlePageChange(event: number) {
    this.tableTemplatePage = event
    this.getTableTemplates(this.lab_group_id)
  }

}
