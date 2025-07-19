import { Component } from '@angular/core';
import {WebService} from "../web.service";
import {MetadataService} from "../metadata.service";
import {SiteSettingsService} from "../site-settings.service";
import {LabGroup, LabGroupQuery} from "../lab-group";
import {FormArray, FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MetadataColumn, MetadataTableTemplate, MetadataTableTemplateQuery} from "../metadata-column";
import {
  NgbAlert,
  NgbCollapse,
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
import {SamplePool} from "../sample-pool";
import {CommonModule} from "@angular/common";

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
    NgbCollapse,
    NgbTooltip,
    CommonModule,
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
    include_pools: this.fb.control<boolean>(false),
  })

  metadataTableTemplateQuery: MetadataTableTemplateQuery|undefined = undefined;
  metadataTableTemplatePage = 1
  metadataTableTemplatePageSize = 5

  labGroupMap: { [key: number]: LabGroup } = {};
  selectedRow: MetadataTableTemplate|undefined = undefined ;
  missingColumns: string[] = [];
  showMissingColumns: boolean = false;
  searchColumn: string = "";
  
  // Pool-related properties for playground
  pools: any[] = [];
  
  // Layout state properties
  layoutMode: 'compact' | 'expanded' = 'expanded';
  sidebarCollapsed: boolean = false;
  templatesCollapsed: boolean = false;
  editorCollapsed: boolean = false;
  
  // Local storage configuration
  private readonly STORAGE_KEY = 'sdrfPlaygroundState';

  constructor(private toast: ToastService, private modal: NgbModal, private web: WebService, public metadata: MetadataService, private fb: FormBuilder, private siteSettings: SiteSettingsService) {
    this.getLabGroups()
    
    // Subscribe to lab group selection changes
    this.form.controls.lab_group_id.valueChanges.subscribe(
      (value) => {
        this.professionalLabGroupPage = 1
        if (value) {
          if (this.professionalLabGroupQuery) {
            this.selectedLabGroup = this.professionalLabGroupQuery.results.find((labGroup) => labGroup.id === value)
          }
          this.getTemplates(this.form.controls.searchTableTerm.value, value)
          this.saveState(); // Save state when lab group changes
        }
      }
    )
    
    // Subscribe to search term changes for lab groups
    this.form.controls.searchTerm.valueChanges.subscribe(
      (value) => {
        this.professionalLabGroupPage = 1
        this.getLabGroups(value)
      }
    )
    
    // Subscribe to form changes to save state
    this.form.valueChanges.subscribe(() => {
      this.saveState();
    });
    
    // Load saved state on initialization
    setTimeout(() => {
      this.loadState();
    }, 100);
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
    this.showMissingColumns = false; // Reset missing columns display
    this.saveState(); // Save state when template is selected
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
      const includePools = this.form.value.include_pools && this.pools.length > 0;
      
      // Show progress toast
      const progressToast = await this.toast.show(
        'Excel Export', 
        'Preparing export...', 
        0, 
        'info', 
        0
      );
      
      try {
        const wb = await this.metadata.convert_metadata_to_excel(
          this.selectedRow.user_columns, 
          this.selectedRow.staff_columns, 
          this.form.value.sample_number, 
          0, 
          this.form.value.lab_group_id, 
          this.selectedRow.field_mask_mapping,
          includePools ? this.pools : [],
          (progress: number, status: string) => {
            // Update progress toast
            if (progressToast) {
              progressToast.progress = progress;
              progressToast.body = status;
            }
          }
        );
        
        // Update progress for buffer creation
        if (progressToast) {
          progressToast.progress = 95;
          progressToast.body = 'Creating download file...';
        }
        
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exported_${includePools ? 'with_pools_' : ''}${Date.now()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Complete progress
        if (progressToast) {
          progressToast.progress = 100;
          progressToast.body = 'Download started successfully!';
          setTimeout(() => this.toast.remove(progressToast), 1000);
        }
        
      } catch (error) {
        console.error('Excel export failed:', error);
        if (progressToast) {
          this.toast.remove(progressToast);
        }
        this.toast.show('Export Failed', 'Failed to export Excel template', 3000, 'error');
      }
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
                const result = await this.metadata.import_metadata_from_sdrf(data as string, this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id, this.pools);
                this.selectedRow.user_columns = result.user_metadata;
                this.selectedRow.staff_columns = result.staff_metadata;
                
                // Update pools if they were detected in SDRF
                if (result.pools && result.pools.length > 0) {
                  this.pools = result.pools;
                  this.form.patchValue({ include_pools: true });
                  this.toast.show('Import', `Detected ${result.pools.length} pools in SDRF file`, 3000, 'info');
                }
                
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
                const result = await this.metadata.read_metadata_from_excel(data as ArrayBuffer, this.selectedRow.user_columns, this.selectedRow.staff_columns, this.form.value.sample_number, 0, this.form.value.lab_group_id, this.selectedRow.field_mask_mapping, this.pools);
                
                console.log('Excel import result:', result);
                console.log('Original user columns:', this.selectedRow.user_columns.length);
                console.log('Original staff columns:', this.selectedRow.staff_columns.length);
                console.log('Imported user columns:', result.user_metadata?.length || 0);
                console.log('Imported staff columns:', result.staff_metadata?.length || 0);
                
                this.selectedRow.user_columns = result.user_metadata;
                this.selectedRow.staff_columns = result.staff_metadata;
                
                // Update pools if they were detected in Excel
                if (result.pools && result.pools.length > 0) {
                  this.pools = result.pools;
                  this.form.patchValue({ include_pools: true });
                  this.toast.show('Import', `Detected ${result.pools.length} pools in Excel file`, 3000, 'info');
                }
                
                this.missingColumns = this.metadata.checkMissingColumnMetadata(this.selectedRow.user_columns, this.selectedRow.staff_columns);
                this.recalculateHiddenColumns();
                
                // Show import success message
                const totalColumns = result.user_metadata.length + result.staff_metadata.length;
                this.toast.show('Import', `Successfully imported ${totalColumns} metadata columns from Excel`, 3000, 'success');
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
      const includePools = this.form.value.include_pools && this.pools.length > 0;
      // For SDRF export, only include reference pools if pools are enabled
      const referencePools = includePools ? this.pools.filter(p => p.is_reference) : [];
      
      const sdrf = await this.metadata.export_metadata_to_sdrf(
        this.selectedRow.user_columns, 
        this.selectedRow.staff_columns, 
        this.form.value.sample_number, 
        0, 
        this.form.value.lab_group_id,
        referencePools
      );
      const textContent = sdrf.map((row) => row.join("\t")).join("\n");
      const blob = new Blob([textContent], {type: 'text/plain'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exported_${includePools ? 'with_pools_' : ''}${Date.now()}.sdrf.tsv`;
      a.click();
      window.URL.revokeObjectURL(url);

    }
  }

  async validateMetadata() {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.lab_group_id) {
      this.currentToast = await this.toast.show("Validation", "Validating metadata", 0, "info", 5)
      const includePools = this.form.value.include_pools && this.pools.length > 0;
      const referencePools = includePools ? this.pools.filter(p => p.is_reference) : [];
      
      const errors = await this.metadata.validateMetadata(
        this.selectedRow.user_columns, 
        this.selectedRow.staff_columns, 
        this.form.value.sample_number, 
        0, 
        this.form.value.lab_group_id,
        referencePools
      );
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

  // Pool Management Methods for Playground
  showPoolManager: boolean = false;
  newPoolName: string = '';
  newPoolIsReference: boolean = false;
  selectedPooledOnly: number[] = [];
  selectedPooledAndIndependent: number[] = [];

  openPooledSampleModal() {
    if (this.selectedRow && this.form.value.sample_number && this.form.value.sample_number > 0) {
      this.showPoolManager = !this.showPoolManager;
      if (this.showPoolManager) {
        this.updatePoolOverview();
      }
    } else {
      this.toast.show('Error', 'Please select a template and set sample number first', 2000, 'error');
    }
  }

  getSampleNumbers(): number[] {
    return Array.from({ length: this.form.value.sample_number || 10 }, (_, i) => i + 1);
  }

  isPooledOnly(sampleIndex: number): boolean {
    return this.selectedPooledOnly.includes(sampleIndex);
  }

  isPooledAndIndependent(sampleIndex: number): boolean {
    return this.selectedPooledAndIndependent.includes(sampleIndex);
  }

  isIndependent(sampleIndex: number): boolean {
    return !this.selectedPooledOnly.includes(sampleIndex) && !this.selectedPooledAndIndependent.includes(sampleIndex);
  }

  onSampleCheckboxChange(sampleIndex: number, event: Event) {
    const isSelected = (event.target as HTMLInputElement).checked;
    if (!isSelected) {
      this.removeSampleFromAllArrays(sampleIndex);
    } else {
      if (!this.selectedPooledOnly.includes(sampleIndex)) {
        this.selectedPooledOnly.push(sampleIndex);
      }
    }
  }

  onSampleSelectionChange(sampleIndex: number, selectionType: 'pooled_only' | 'pooled_and_independent', event: Event) {
    const isSelected = (event.target as HTMLInputElement).checked;
    if (selectionType === 'pooled_only') {
      if (isSelected) {
        if (!this.selectedPooledOnly.includes(sampleIndex)) {
          this.selectedPooledOnly.push(sampleIndex);
        }
        const index = this.selectedPooledAndIndependent.indexOf(sampleIndex);
        if (index > -1) {
          this.selectedPooledAndIndependent.splice(index, 1);
        }
      }
    } else if (selectionType === 'pooled_and_independent') {
      if (isSelected) {
        if (!this.selectedPooledAndIndependent.includes(sampleIndex)) {
          this.selectedPooledAndIndependent.push(sampleIndex);
        }
        const index = this.selectedPooledOnly.indexOf(sampleIndex);
        if (index > -1) {
          this.selectedPooledOnly.splice(index, 1);
        }
      }
    }
  }

  private removeSampleFromAllArrays(sampleIndex: number) {
    const pooledOnlyIndex = this.selectedPooledOnly.indexOf(sampleIndex);
    if (pooledOnlyIndex > -1) {
      this.selectedPooledOnly.splice(pooledOnlyIndex, 1);
    }
    const pooledAndIndependentIndex = this.selectedPooledAndIndependent.indexOf(sampleIndex);
    if (pooledAndIndependentIndex > -1) {
      this.selectedPooledAndIndependent.splice(pooledAndIndependentIndex, 1);
    }
  }

  createPool() {
    if (!this.newPoolName.trim()) {
      this.toast.show('Error', 'Pool name is required', 2000, 'error');
      return;
    }

    if (this.selectedPooledOnly.length === 0 && this.selectedPooledAndIndependent.length === 0) {
      this.toast.show('Error', 'Please select at least one sample for the pool', 2000, 'error');
      return;
    }

    const newPool: any = {
      id: Date.now(), // Mock ID for playground
      pool_name: this.newPoolName,
      pooled_only_samples: [...this.selectedPooledOnly],
      pooled_and_independent_samples: [...this.selectedPooledAndIndependent],
      is_reference: this.newPoolIsReference,
      user_metadata: [],
      staff_metadata: []
    };

    this.pools.push(newPool);
    this.updatePoolOverview();
    
    // Reset form
    this.newPoolName = '';
    this.newPoolIsReference = false;
    this.selectedPooledOnly = [];
    this.selectedPooledAndIndependent = [];

    this.toast.show('Success', `Pool "${newPool.pool_name}" created successfully`, 2000, 'success');
  }

  deletePool(pool: any) {
    const index = this.pools.findIndex(p => p.id === pool.id);
    if (index > -1) {
      this.pools.splice(index, 1);
      this.updatePoolOverview();
      this.toast.show('Success', `Pool "${pool.pool_name}" deleted`, 2000, 'success');
    }
  }

  private updatePoolOverview() {
    // Simple overview calculation for playground
    const allPooledSamples = new Set<number>();
    this.pools.forEach(pool => {
      pool.pooled_only_samples.forEach((s: number) => allPooledSamples.add(s));
      pool.pooled_and_independent_samples.forEach((s: number) => allPooledSamples.add(s));
    });
    
    const pooledSampleCount = allPooledSamples.size;
    const independentSampleCount = (this.form.value.sample_number || 10) - 
      this.pools.reduce((acc, pool) => acc + pool.pooled_only_samples.length, 0);
  }

  formatSampleRange(samples: number[]): string {
    if (samples.length === 0) return 'None';
    
    const sorted = [...samples].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else if (end === start + 1) {
          ranges.push(`${start}, ${end}`);
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = sorted[i];
        end = sorted[i];
      }
    }
    
    if (start === end) {
      ranges.push(start.toString());
    } else if (end === start + 1) {
      ranges.push(`${start}, ${end}`);
    } else {
      ranges.push(`${start}-${end}`);
    }
    
    return ranges.join(', ');
  }

  // Helper methods for template expressions
  get referencePoolsCount(): number {
    return this.pools.filter((p: any) => p.is_reference).length;
  }

  get hasPoolsEnabled(): boolean {
    return !!(this.form.value.include_pools && this.pools.length > 0);
  }

  get hasReferencePoolsEnabled(): boolean {
    return !!(this.form.value.include_pools && this.referencePoolsCount > 0);
  }

  // Layout control methods
  toggleLayoutMode() {
    this.layoutMode = this.layoutMode === 'compact' ? 'expanded' : 'compact';
    this.saveState(); // Save state when layout changes
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }

  // Local storage methods
  saveState(showToast: boolean = false): void {
    try {
      const state = {
        labGroupId: this.form.value.lab_group_id,
        selectedTemplateId: this.selectedRow?.id,
        tableConfig: {
          sample_number: this.form.value.sample_number,
          show_hidden: this.form.value.show_hidden,
          injection_volume: this.form.value.injection_volume,
          include_pools: this.form.value.include_pools
        },
        layoutConfig: {
          layoutMode: this.layoutMode,
          templatesCollapsed: this.templatesCollapsed,
          editorCollapsed: this.editorCollapsed
        },
        searchColumn: this.searchColumn,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      
      if (showToast) {
        this.toast.show('Playground', 'Configuration saved successfully', 2000, 'success');
      }
    } catch (error) {
      console.warn('Failed to save playground state to localStorage:', error);
      if (showToast) {
        this.toast.show('Playground', 'Failed to save configuration', 2000, 'error');
      }
    }
  }

  private loadState(): void {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Check if state is not too old (24 hours)
        if (state.timestamp && (Date.now() - state.timestamp) < 24 * 60 * 60 * 1000) {
          // Restore form values
          if (state.tableConfig) {
            this.form.patchValue({
              sample_number: state.tableConfig.sample_number || 10,
              show_hidden: state.tableConfig.show_hidden ?? false,
              injection_volume: state.tableConfig.injection_volume || 0,
              include_pools: state.tableConfig.include_pools ?? false
            });
          }
          
          // Restore layout config
          if (state.layoutConfig) {
            this.layoutMode = state.layoutConfig.layoutMode || 'expanded';
            this.templatesCollapsed = state.layoutConfig.templatesCollapsed ?? false;
            this.editorCollapsed = state.layoutConfig.editorCollapsed ?? false;
          }
          
          // Restore search column
          if (state.searchColumn) {
            this.searchColumn = state.searchColumn;
          }
          
          // Restore lab group selection (will trigger template loading)
          if (state.labGroupId) {
            setTimeout(() => {
              this.form.patchValue({ lab_group_id: state.labGroupId });
              
              // Restore selected template after lab group is loaded
              if (state.selectedTemplateId) {
                setTimeout(() => {
                  this.restoreSelectedTemplate(state.selectedTemplateId);
                }, 500);
              }
            }, 100);
          }
          
          this.toast.show('Playground', 'Previous configuration restored', 2000, 'info');
        }
      }
    } catch (error) {
      console.warn('Failed to load playground state from localStorage:', error);
    }
  }

  private restoreSelectedTemplate(templateId: number): void {
    if (this.metadataTableTemplateQuery?.results) {
      const template = this.metadataTableTemplateQuery.results.find(t => t.id === templateId);
      if (template) {
        this.selectRow(template);
      }
    }
  }

  clearSavedState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.toast.show('Playground', 'Saved configuration cleared', 2000, 'info');
    } catch (error) {
      console.warn('Failed to clear playground state from localStorage:', error);
    }
  }
  
  get missingColumnsTooltip(): string {
    if (this.missingColumns.length === 0) return '';
    return `Missing required columns: ${this.missingColumns.join(', ')}. Click to ${this.showMissingColumns ? 'hide' : 'show'} details.`;
  }
}
