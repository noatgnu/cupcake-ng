import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JobSubmissionService } from '../job-submission.service';
import { ToastService } from '../../../../toast.service';
import {
  SamplePool,
  SamplePoolCreateRequest,
  SampleStatusOverview
} from '../../../../sample-pool';

@Component({
  selector: 'app-pooled-sample-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pooled-sample-modal.component.html',
  styleUrls: ['./pooled-sample-modal.component.scss']
})
export class PooledSampleModalComponent implements OnInit {
  poolForm: FormGroup;
  instrumentJobId!: number;
  sampleNumber!: number;
  existingPools: SamplePool[] = [];
  sampleStatusOverview: SampleStatusOverview[] = [];
  selectedPooledOnly: number[] = [];
  selectedPooledAndIndependent: number[] = [];
  
  // Pagination properties
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  
  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private jobSubmissionService: JobSubmissionService,
    private toast: ToastService
  ) {
    this.poolForm = this.fb.group({
      pool_name: ['', Validators.required],
      template_sample: [''],
      is_reference: [false]
    });
  }

  ngOnInit(): void {
    this.calculatePagination();
    this.refreshData();
  }

  refreshData(): void {
    this.loadExistingPools();
    this.loadSampleStatusOverview();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.sampleNumber / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  loadExistingPools() {
    if (this.instrumentJobId) {
      this.jobSubmissionService.getSamplePools(this.instrumentJobId).subscribe({
        next: (response) => {
          this.existingPools = response;
        },
        error: (error) => {
          console.error('Error loading existing pools:', error);
        }
      });
    }
  }

  loadSampleStatusOverview() {
    if (this.instrumentJobId) {
      this.jobSubmissionService.getSampleStatusOverview(this.instrumentJobId).subscribe({
        next: (response) => {
          this.sampleStatusOverview = response;
        },
        error: (error) => {
          console.error('Error loading sample status overview:', error);
        }
      });
    }
  }

  getSampleNumbers(): number[] {
    return Array.from({ length: this.sampleNumber }, (_, i) => i + 1);
  }

  getSampleOptions(): number[] {
    return Array.from({ length: this.sampleNumber }, (_, i) => i + 1);
  }

  getSampleName(sampleIndex: number): string {
    const sampleOverview = this.sampleStatusOverview.find(s => s.sample_index === sampleIndex);
    return sampleOverview?.sample_name || `Sample ${sampleIndex}`;
  }

  getPaginatedSamples(): number[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.sampleNumber);
    return Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getVisiblePages(): number[] {
    const maxVisible = 5;
    const pages: number[] = [];
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  onSampleCheckboxChange(sampleIndex: number, event: Event) {
    const isSelected = (event.target as HTMLInputElement).checked;
    if (!isSelected) {
      // Remove from both arrays if checkbox is unchecked
      this.removeSampleFromAllArrays(sampleIndex);
    } else {
      // Add to pooled_only by default when checkbox is checked
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
        // Remove from pooled_and_independent if it exists there
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
        // Remove from pooled_only if it exists there
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

  isPooledOnly(sampleIndex: number): boolean {
    return this.selectedPooledOnly.includes(sampleIndex);
  }

  isPooledAndIndependent(sampleIndex: number): boolean {
    return this.selectedPooledAndIndependent.includes(sampleIndex);
  }

  isIndependent(sampleIndex: number): boolean {
    return !this.selectedPooledOnly.includes(sampleIndex) && !this.selectedPooledAndIndependent.includes(sampleIndex);
  }

  getSampleStatusText(sampleIndex: number): string {
    if (this.isPooledOnly(sampleIndex)) {
      return 'Pooled Only';
    } else if (this.isPooledAndIndependent(sampleIndex)) {
      return 'Pooled + Independent';
    } else {
      return 'Independent';
    }
  }

  getSampleStatusClass(sampleIndex: number): string {
    if (this.isPooledOnly(sampleIndex)) {
      return 'bg-warning text-dark';
    } else if (this.isPooledAndIndependent(sampleIndex)) {
      return 'bg-info text-dark';
    } else {
      return 'bg-secondary text-white';
    }
  }

  getStatusAbbreviation(sampleIndex: number): string {
    if (this.isPooledOnly(sampleIndex)) {
      return 'P.Only';
    } else if (this.isPooledAndIndependent(sampleIndex)) {
      return 'P.+Ind';
    } else {
      return 'Indep';
    }
  }

  onSubmit() {
    if (this.poolForm.valid) {
      const poolData: SamplePoolCreateRequest = {
        pool_name: this.poolForm.value.pool_name,
        pooled_only_samples: this.selectedPooledOnly,
        pooled_and_independent_samples: this.selectedPooledAndIndependent,
        template_sample: this.poolForm.value.template_sample ? parseInt(this.poolForm.value.template_sample) : undefined,
        is_reference: this.poolForm.value.is_reference
      };

      this.jobSubmissionService.createSamplePool(this.instrumentJobId, poolData).subscribe({
        next: (response) => {
          this.toast.show('Success', 'Sample pool created successfully', 2000, 'success');
          // Refresh the existing pools list to show the newly created pool
          this.refreshData();
          // Reset the form but keep the modal open
          this.poolForm.reset();
          this.selectedPooledOnly = [];
          this.selectedPooledAndIndependent = [];
          // Signal success to parent component so it can reload job metadata
          this.activeModal.close({ success: true, pool: response });
        },
        error: (error) => {
          console.error('Error creating sample pool:', error);
          this.toast.show('Error', 'Failed to create sample pool: ' + (error.error?.message || error.message), 2000, 'error');
        }
      });
    }
  }

  // Batch selection methods
  applyBatchSelection(input: string, selectionType: string) {
    const sampleNumbers = this.parseSampleInput(input);
    if (sampleNumbers.length === 0) {
      this.toast.show('Error', 'Invalid sample range format', 2000, 'error');
      return;
    }

    for (const sampleNumber of sampleNumbers) {
      if (sampleNumber >= 1 && sampleNumber <= this.sampleNumber) {
        this.removeSampleFromAllArrays(sampleNumber);
        
        if (selectionType === 'pooled_only') {
          this.selectedPooledOnly.push(sampleNumber);
        } else if (selectionType === 'pooled_and_independent') {
          this.selectedPooledAndIndependent.push(sampleNumber);
        }
        // If selectionType is 'independent', we just remove from all arrays
      }
    }

    // Sort arrays
    this.selectedPooledOnly.sort((a, b) => a - b);
    this.selectedPooledAndIndependent.sort((a, b) => a - b);
  }

  selectAll(selectionType: 'pooled_only' | 'pooled_and_independent') {
    this.clearAll();
    const allSamples = this.getSampleNumbers();
    
    if (selectionType === 'pooled_only') {
      this.selectedPooledOnly = [...allSamples];
    } else {
      this.selectedPooledAndIndependent = [...allSamples];
    }
  }

  clearAll() {
    this.selectedPooledOnly = [];
    this.selectedPooledAndIndependent = [];
  }

  parseSampleInput(input: string): number[] {
    const result: number[] = [];
    const trimmed = input.trim();
    
    if (!trimmed) return result;
    
    const parts = trimmed.split(',');
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      
      if (trimmedPart.includes('-')) {
        // Handle range like "1-5"
        const [start, end] = trimmedPart.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!result.includes(i)) {
              result.push(i);
            }
          }
        }
      } else {
        // Handle single number
        const num = parseInt(trimmedPart);
        if (!isNaN(num) && !result.includes(num)) {
          result.push(num);
        }
      }
    }
    
    return result.sort((a, b) => a - b);
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
    
    // Add the last range
    if (start === end) {
      ranges.push(start.toString());
    } else if (end === start + 1) {
      ranges.push(`${start}, ${end}`);
    } else {
      ranges.push(`${start}-${end}`);
    }
    
    return ranges.join(', ');
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  // SDRF Preview Methods
  getPooledSamplesPreview(): {sampleIndex: number, sourceName: string, sdrfValue: string, status: string}[] {
    const preview: {sampleIndex: number, sourceName: string, sdrfValue: string, status: string}[] = [];
    
    // Add pooled only samples
    for (const sampleIndex of this.selectedPooledOnly) {
      const sourceName = this.getSampleName(sampleIndex);
      const sdrfValue = this.generatePoolSdrfValue();
      preview.push({
        sampleIndex,
        sourceName,
        sdrfValue,
        status: 'Pooled Only'
      });
    }
    
    // Add pooled and independent samples
    for (const sampleIndex of this.selectedPooledAndIndependent) {
      const sourceName = this.getSampleName(sampleIndex);
      preview.push({
        sampleIndex,
        sourceName,
        sdrfValue: 'not pooled',
        status: 'Pooled + Independent'
      });
    }
    
    return preview.sort((a, b) => a.sampleIndex - b.sampleIndex);
  }

  generatePoolSdrfValue(): string {
    if (this.selectedPooledOnly.length === 0) {
      return 'not pooled';
    }
    
    const poolName = this.poolForm.get('pool_name')?.value || 'unnamed_pool';
    const sourceNames = this.selectedPooledOnly.map(index => this.getSampleName(index));
    return `SN=${sourceNames.join(',')}`;
  }

  getPoolPreviewSummary(): string {
    const totalSelected = this.selectedPooledOnly.length + this.selectedPooledAndIndependent.length;
    if (totalSelected === 0) {
      return 'No samples selected';
    }
    
    const poolName = this.poolForm.get('pool_name')?.value || 'unnamed_pool';
    return `Pool "${poolName}" with ${totalSelected} samples (${this.selectedPooledOnly.length} pooled only, ${this.selectedPooledAndIndependent.length} pooled + independent)`;
  }

  shouldShowPreview(): boolean {
    return this.selectedPooledOnly.length > 0 || this.selectedPooledAndIndependent.length > 0;
  }

  // Get full SDRF preview with all metadata columns
  getFullSdrfPreview(): {sample: any, metadata: {[key: string]: string}}[] {
    const preview: {sample: any, metadata: {[key: string]: string}}[] = [];
    
    // Get all selected samples
    const allSelectedSamples = [
      ...this.selectedPooledOnly.map(index => ({index, type: 'pooled_only'})),
      ...this.selectedPooledAndIndependent.map(index => ({index, type: 'pooled_and_independent'}))
    ];
    
    for (const sample of allSelectedSamples) {
      const sampleOverview = this.sampleStatusOverview.find(s => s.sample_index === sample.index);
      const metadata: {[key: string]: string} = {};
      
      // Basic sample information
      metadata['source name'] = sampleOverview?.sample_name || `Sample ${sample.index}`;
      
      // Pooled sample information
      if (sample.type === 'pooled_only') {
        metadata['characteristics[pooled sample]'] = this.generatePoolSdrfValue();
      } else {
        metadata['characteristics[pooled sample]'] = 'not pooled';
      }
      
      // Add other common SDRF columns (these would come from the job's metadata)
      metadata['characteristics[organism]'] = this.getMetadataValue('organism', sample.index);
      metadata['characteristics[disease]'] = this.getMetadataValue('disease', sample.index);
      metadata['characteristics[cell type]'] = this.getMetadataValue('cell type', sample.index);
      metadata['characteristics[tissue]'] = this.getMetadataValue('tissue', sample.index);
      metadata['assay name'] = this.getMetadataValue('Assay name', sample.index);
      metadata['technology type'] = this.getMetadataValue('Technology type', sample.index);
      
      preview.push({
        sample: {
          index: sample.index,
          type: sample.type,
          sourceName: metadata['source name']
        },
        metadata
      });
    }
    
    return preview.sort((a, b) => a.sample.index - b.sample.index);
  }

  // Get metadata value for a specific sample (placeholder - would need actual metadata from backend)
  getMetadataValue(metadataName: string, sampleIndex: number): string {
    // This is a placeholder - in a real implementation, this would fetch the actual metadata
    // from the instrument job's metadata columns and apply modifiers for specific samples
    const placeholderValues: {[key: string]: string} = {
      'organism': 'Homo sapiens',
      'disease': 'normal',
      'cell type': 'primary cell',
      'tissue': 'plasma',
      'Assay name': 'sample_' + sampleIndex,
      'Technology type': 'proteomics'
    };
    
    return placeholderValues[metadataName] || 'not specified';
  }

  // Get all unique metadata column names for the preview table
  getMetadataColumnNames(): string[] {
    return [
      'source name',
      'characteristics[organism]',
      'characteristics[disease]',
      'characteristics[cell type]',
      'characteristics[tissue]',
      'characteristics[pooled sample]',
      'assay name',
      'technology type'
    ];
  }

  // Toggle between simple and full preview
  showFullPreview: boolean = false;

  togglePreviewMode(): void {
    this.showFullPreview = !this.showFullPreview;
  }
}