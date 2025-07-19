import {Component, EventEmitter, HostListener, Input, OnChanges, OnInit, OnDestroy, Output, SimpleChanges, ViewChild, ElementRef} from '@angular/core';
import {MetadataColumn, MetadataTableTemplate} from "../../../../metadata-column";
import {
  DisplayModificationParametersMetadataComponent
} from "../../../../display-modification-parameters-metadata/display-modification-parameters-metadata.component";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {
  JobMetadataCreationModalComponent
} from "../../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {FormArray, FormsModule} from "@angular/forms";
import {NgClass} from "@angular/common";
import {AddFavouriteModalComponent} from "../../../../add-favourite-modal/add-favourite-modal.component";
import {
  MultipleLineInputModalComponent
} from "../../../../multiple-line-input-modal/multiple-line-input-modal.component";
import {MetadataService} from "../../../../metadata.service";
import {ToastService} from "../../../../toast.service";

@Component({
  selector: 'app-metadata-table',
  imports: [
    NgbTooltip,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgClass,
    FormsModule
  ],
  templateUrl: './metadata-table.component.html',
  styleUrl: './metadata-table.component.scss'
})
export class MetadataTableComponent implements OnChanges, OnInit, OnDestroy {
  currentCell: { row: number, col: number }|null = null
  selectionMode: boolean = false
  selectionModeColIndex: number = -1
  originCell: { row: number, col: number }|null = null
  private _filterTableColumnName: string = ""
  visibleColumnNames: string[] = []
  @Input() templateMode: boolean = false
  @Input() service_lab_group_id: number = 0
  @Input() set filterTableColumnName(value: string) {
    this._filterTableColumnName = value
    if (value && value.length > 0) {
      this.visibleColumnNames = this.userMetadata.concat(this.staffMetadata).filter(col => col.name.toLowerCase().includes(value.toLowerCase())).map(col => col.name)
    } else {
      this.visibleColumnNames = this.userMetadata.concat(this.staffMetadata).map(col => col.name)
    }
  }
  get filterTableColumnName(): string {
    return this._filterTableColumnName
  }

  @Input() userCanEdit: boolean = false
  @Input() sampleNumber: number = 0
  @Input() showHidden: boolean = false
  @Input() userMetadata: MetadataColumn[] = []

  @Input() staffMetadata: MetadataColumn[] = []

  @Input() staffModeActive: boolean = false
  @Input() existingPools: any[] = []
  
  // Pool table interaction properties
  currentPoolCell: { row: number, col: number } | null = null
  poolSelectionMode: boolean = false
  poolSelectionModeColIndex: number = -1
  poolOriginCell: { row: number, col: number } | null = null
  selectedPoolCells: { row: number, col: number }[] = []

  tableData: any[] = []
  
  // Pagination properties
  currentPage: number = 1
  pageSize: number = 10
  pageSizeOptions: number[] = [5, 10, 25, 50, 100]
  
  // Make Math available in template
  Math = Math
  
  // Horizontal scroll properties
  @ViewChild('tableContainer', { static: false }) tableContainer!: ElementRef<HTMLDivElement>
  canScrollLeft: boolean = false
  canScrollRight: boolean = false
  scrollAmount: number = 200 // pixels to scroll per click
  scrollProgress: number = 0 // Cache the scroll progress
  
  // State persistence properties
  private stateKey: string = 'metadataTableState'
  private scrollRestoreTimeout?: number

  @Output() metadataUpdated: EventEmitter<any[]> = new EventEmitter<any[]>()
  @Output() removeMetadata: EventEmitter<{ metadata: MetadataColumn, index: number, data_type: 'user_metadata'|'staff_metadata' }> = new EventEmitter<{ metadata: MetadataColumn, index: number, data_type: 'user_metadata'|'staff_metadata' }>()
  @Output() metadataFavouriteAdded: EventEmitter<any> = new EventEmitter<any>()
  @Output() poolDeleted: EventEmitter<any> = new EventEmitter<any>()
  selectedCells: { row: number, col: number }[] = [];
  isShiftSelecting: boolean = false;

  field_mask: {[key: string]: string} = {}
  private _template: MetadataTableTemplate|undefined|null

  @Input() set template(template: MetadataTableTemplate|undefined|null) {
    this._template = template
    this.field_mask = {}
    if (template) {
      for (const col of template.field_mask_mapping) {
        this.field_mask[col.name] = col.mask
      }
    }
  }

  get template(): MetadataTableTemplate|undefined|null {
    return this._template
  }

  // Pagination getters
  get totalPages(): number {
    return Math.ceil(this.tableData.length / this.pageSize)
  }

  get paginatedTableData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize
    return this.tableData.slice(startIndex, startIndex + this.pageSize)
  }

  get startItemNumber(): number {
    return (this.currentPage - 1) * this.pageSize + 1
  }

  get endItemNumber(): number {
    return Math.min(this.currentPage * this.pageSize, this.tableData.length)
  }

  onCellClick(event: MouseEvent, rowIndex: number, colIndex: number) {
    if (event.shiftKey && this.selectedCells.length > 0) {
      this.isShiftSelecting = true;
      const lastSelectedCell = this.selectedCells[this.selectedCells.length - 1];
      this.selectCellsInRange(lastSelectedCell.row, lastSelectedCell.col, rowIndex, colIndex);
    } else {
      this.isShiftSelecting = false;
      this.selectedCells = [{ row: rowIndex, col: colIndex }];
    }
  }

  selectCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number) {
    this.selectedCells = [];
    for (let i = Math.min(startRow, endRow); i <= Math.max(startRow, endRow); i++) {
      this.selectedCells.push({ row: i, col: startCol });
    }
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text');
    if (pastedText && this.selectedCells.length > 0) {
      this.pasteContentIntoSelectedCells(pastedText);
    }
  }


  pasteContentIntoSelectedCells(content: string) {
    const lines = content.split('\n');
    for (let i = 0; i < this.selectedCells.length && i < lines.length; i++) {
      const cell = this.selectedCells[i];
      const row = this.tableData[cell.row];
      const colKey = `col_${cell.col}`;
      row[colKey] = lines[i];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["sampleNumber"] || changes["userMetadata"] || changes["staffMetadata"]) {
      this.generateTableData()
      // Restore table state after table data changes
      setTimeout(() => {
        this.restoreStateAfterTableUpdate()
      }, 100) // Slightly longer timeout to ensure DOM is ready
    }
  }

  private restoreStateAfterTableUpdate(): void {
    // Validate that current page is still valid with new data
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages
    }
    
    // Restore scroll position if available
    const savedState = this.getSavedState()
    if (savedState?.scrollLeft !== undefined) {
      this.restoreScrollPosition(savedState.scrollLeft)
    } else {
      this.onTableScroll()
    }
  }

  private getSavedState(): any {
    try {
      const savedState = localStorage.getItem(this.stateKey)
      return savedState ? JSON.parse(savedState) : null
    } catch (error) {
      return null
    }
  }

  constructor(private modal: NgbModal, public metadataService: MetadataService, private toastService: ToastService) {

  }

  ngOnInit(): void {
    this.loadTableState()
  }

  ngOnDestroy(): void {
    this.saveTableState()
    if (this.scrollRestoreTimeout) {
      clearTimeout(this.scrollRestoreTimeout)
    }
    if (this.saveScrollTimeout) {
      clearTimeout(this.saveScrollTimeout)
    }
  }

  parseSampleRanges(samples: string): number[] {
    const result: number[] = [];
    const ranges = samples.split(',');
    ranges.forEach(range => {
      const [start, end] = range.split('-').map(Number);
      if (end !== undefined) {
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
      } else {
        result.push(start);
      }
    });
    return result;
  }

  generateTableData() {
    if (this.sampleNumber === 0) {
      return;
    }
    this.visibleColumnNames = this.userMetadata.concat(this.staffMetadata).map(col => col.name)
    this.tableData = []; // Clear previous data
    for (let i = 1; i <= this.sampleNumber; i++) {
      const row: any = { sample: i };
      [...this.userMetadata, ...this.staffMetadata].forEach((column, index) => {
        let value = column.value;
        if (column.modifiers) {
          column.modifiers.forEach(val => {
            const sampleIndices = this.parseSampleRanges(val.samples);
            if (sampleIndices.includes(i)) {
              value = val.value;
            }
          });
        }

        row[`col_${index}`] = value; // Use a unique key for each column
      });
      this.tableData.push(row);
    }
    console.log(this.tableData)
  }

  editCell(row: any, metadata: MetadataColumn, index: number, data_type: 'user_metadata' | 'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent)
    ref.componentInstance.previewMode = this.templateMode
    if (this.service_lab_group_id > 0) {
      ref.componentInstance.service_lab_group_id = this.service_lab_group_id
    }
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    if (metadata.value) {
      ref.componentInstance.value = metadata.value
    }
    if (metadata.name === "Modification parameters") {
      ref.componentInstance.allowMultipleSpecSelection = false
    }

    const oldValue = row[`col_${index}`];

    ref.result.then((result: any[]) => {
      if (result) {

        const d = this.searchAndUpdateMetadata(result, row, index, metadata, data_type, oldValue);
        this.metadataUpdated.emit(d)
      }
    }).catch((error) => {
      console.log(error)
    })

  }

  private searchAndUpdateMetadata(result: any[], row: any, index: number, metadata: MetadataColumn, data_type: "user_metadata" | "staff_metadata", oldValue: string, updateMainModifier: boolean = true): any[] {
    const d: any[] = []
    for (const r of result) {
      this.tableData[row.sample - 1][`col_${index}`] = r.metadataValue.slice()
      let value = r.metadataValue.slice()
      if (r.metadataName === "Modification parameters") {
        if (r.metadataMT) {
          value += `;mt=${r.metadataMT}`
        }
        if (r.metadataPP) {
          value += `;pp=${r.metadataPP}`
        }
        if (r.metadataTA) {
          value += `;ta=${r.metadataTA}`
        }
        if (r.metadataTS) {
          value += `;ts=${r.metadataTS}`
        }
        if (r.metadataMM) {
          value += `;mm=${r.metadataMM}`
        }
        if (r.metadataAC) {
          value += `;ac=${r.metadataAC}`
        }
      }
      if (metadata.value === value) {
        // check if any of the modifiers are set with this sample and remove them from the modifiers
        for (const m of metadata.modifiers) {
          const data: any = {
            name: metadata.name,
            value: metadata.value,
            type: metadata.type,
            id: metadata.id,
            data_type: data_type,
            hidden: metadata.hidden,
            auto_generated: metadata.auto_generated,
            readonly: metadata.readonly
          }
          let modifiers = [...metadata.modifiers];
          const sampleIndices = this.parseSampleRanges(m.samples);
          if (sampleIndices.includes(row.sample)) {
            // remove the index from the sampleIndices
            const newSampleIndices = sampleIndices.filter(i => i !== row.sample);
            if (newSampleIndices.length === 0) {
              modifiers.splice(metadata.modifiers.indexOf(m), 1);
              data.modifiers = modifiers;
              d.push(data)
              break
            }
            // convert the sampleIndices to a similar string format as the one in the modifiers and check if any indices are continuous then use a range for those indices
            const sortedIndices = newSampleIndices.sort((a, b) => a - b);
            let start = sortedIndices[0];
            let end = sortedIndices[0];
            const ranges = [];
            for (let i = 1; i < sortedIndices.length; i++) {
              if (sortedIndices[i] === end + 1) {
                end = sortedIndices[i];
              } else {
                if (start === end) {
                  ranges.push(start.toString());
                } else {
                  ranges.push(`${start}-${end}`);
                }
                start = sortedIndices[i];
                end = sortedIndices[i];
              }
            }
            if (start === end) {
              ranges.push(start.toString());
            } else {
              ranges.push(`${start}-${end}`);
            }
            const mod = {
              samples: ranges.join(','),
              value: m.value
            }
            modifiers[modifiers.indexOf(m)] = mod;
            data.modifiers = modifiers;
            d.push(data)
            if (updateMainModifier) {
              metadata.modifiers = modifiers;
            }
          }
        }
      } else {
        const data: any = {
          name: metadata.name,
          value: metadata.value,
          type: metadata.type,
          id: metadata.id,
          data_type: data_type,
          hidden: metadata.hidden,
          auto_generated: metadata.auto_generated,
          readonly: metadata.readonly
        }
        let modifiers = [...metadata.modifiers];
        let found_in_modifiers = false;
        for (const m of metadata.modifiers) {
          if (m.value === oldValue && m.value !== value) {
            const sampleIndices = this.parseSampleRanges(m.samples);
            // remove sample index from the modifier that has the same value as the old value
            const newSampleIndices = sampleIndices.filter(i => i !== row.sample)

            if (newSampleIndices.length === 0) {
              modifiers.splice(modifiers.indexOf(m), 1);
            } else {
              // convert the sampleIndices to a similar string format as the one in the modifiers and check if any indices are continuous then use a range for those indices

              const sortedIndices = newSampleIndices.sort((a, b) => a - b);
              let start = sortedIndices[0];
              let end = sortedIndices[0];
              const ranges = [];
              for (let i = 1; i < sortedIndices.length; i++) {
                if (sortedIndices[i] === end + 1) {
                  end = sortedIndices[i];
                } else {
                  if (start === end) {
                    ranges.push(start.toString());
                  } else {
                    ranges.push(`${start}-${end}`);
                  }
                  start = sortedIndices[i];
                  end = sortedIndices[i];
                }
              }
              if (start === end) {
                ranges.push(start.toString());
              } else {
                ranges.push(`${start}-${end}`);
              }
              const mod = {
                samples: ranges.join(','),
                value: m.value
              }
              modifiers[modifiers.indexOf(m)] = mod;
            }
          }
          if (m.value === value) {
            found_in_modifiers = true;
            const sampleIndices = this.parseSampleRanges(m.samples);
            // add sample index to the modifier that has the same value as the new value
            sampleIndices.push(row.sample);
            // convert the sampleIndices to a similar string format as the one in the modifiers and check if any indices are continuous then use a range for those indices
            const sortedIndices = sampleIndices.sort((a, b) => a - b);
            let start = sortedIndices[0];
            let end = sortedIndices[0];
            const ranges = [];
            for (let i = 1; i < sortedIndices.length; i++) {
              if (sortedIndices[i] === end + 1) {
                end = sortedIndices[i];
              } else {
                if (start === end) {
                  ranges.push(start.toString());
                } else {
                  ranges.push(`${start}-${end}`);
                }
                start = sortedIndices[i];
                end = sortedIndices[i];
              }
            }
            if (start === end) {
              ranges.push(start.toString());
            } else {
              ranges.push(`${start}-${end}`);
            }
            const mod = {
              samples: ranges.join(','),
              value: m.value
            }
            modifiers[modifiers.indexOf(m)] = mod;
            data.modifiers = modifiers;
            d.push(data)
          }
        }
        if (!found_in_modifiers) {
          modifiers.push({
            samples: row.sample.toString(),
            value: value
          })
          data.modifiers = modifiers;
          d.push(data)
        }
        if (updateMainModifier) {
          metadata.modifiers = modifiers;
        }
      }
    }
    return d;
  }

  editDefaultMetadataValue(metadata: MetadataColumn, data_type: 'user_metadata' | 'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent)
    ref.componentInstance.previewMode = this.templateMode || this.staffModeActive
    ref.componentInstance.hidden = metadata.hidden
    ref.componentInstance.readonly = metadata.readonly
    if (this.service_lab_group_id > 0) {
      ref.componentInstance.service_lab_group_id = this.service_lab_group_id
    }
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    if (metadata.value) {
      ref.componentInstance.value = metadata.value
    }
    if (metadata.name === "Modification parameters") {
      ref.componentInstance.allowMultipleSpecSelection = false
    }

    ref.result.then((result: any[]) => {
      if (result) {
        const d: any[] = []
        for (const r of result) {
          let value = r.metadataValue.slice()
          if (r.metadataName === "Modification parameters") {
            if (r.metadataMT) {
              value += `;mt=${r.metadataMT}`
            }
            if (r.metadataPP) {
              value += `;pp=${r.metadataPP}`
            }
            if (r.metadataTA) {
              value += `;ta=${r.metadataTA}`
            }
            if (r.metadataTS) {
              value += `;ts=${r.metadataTS}`
            }
            if (r.metadataMM) {
              value += `;mm=${r.metadataMM}`
            }
            if (r.metadataAC) {
              value += `;ac=${r.metadataAC}`
            }
          }
          const data: any = {
            name: metadata.name,
            value: value,
            type: metadata.type,
            id: metadata.id,
            data_type: data_type,
            hidden: r.hidden,
            readonly: r.readonly,
            auto_generated: r.auto_generated,
          }
          d.push(data)
        }
        this.metadataUpdated.emit(d)
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  exportTableToTSV() {
    const headers = ['Sample', ...this.userMetadata.map(col => col.name), ...this.staffMetadata.map(col => col.name)];
    const rows = this.tableData.map(row => {
      const userMetadataValues = this.userMetadata.map((col, index) => row[`col_${index}`] || '');
      const staffMetadataValues = this.staffMetadata.map((col, index) => row[`col_${this.userMetadata.length + index}`] || '');
      return [row.sample, ...userMetadataValues, ...staffMetadataValues].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table_data.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  copyAndEnableSelectionMode(row: any, metadata: MetadataColumn, index: number, data_type: 'user_metadata' | 'staff_metadata') {
    this.currentCell = { row: row.sample - 1, col: index };
    this.selectionMode = true;
    this.selectionModeColIndex = index;
    this.originCell = { row: row.sample - 1, col: index };
  }

  moveOverCell(rowIndex: number, colIndex: number) {
    this.currentCell = { row: rowIndex, col: colIndex };
    if (this.selectionMode) {
      if (this.selectionModeColIndex === colIndex) {
        // calculate the range of cells to select from the origin cell to the current cell
        if (this.originCell) {
          this.selectCellsInRange(this.originCell.row, this.originCell.col, rowIndex, colIndex);
        }
      }
    }
  }

  isSelectedCell(rowIndex: number, colIndex: number): boolean {
    return this.selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
  }

  pasteContentFromOriginToCells(metadata: MetadataColumn, data_type: "user_metadata"|"staff_metadata") {
    if (this.originCell) {
      const originValue = this.tableData[this.originCell.row][`col_${this.originCell.col}`];
      let isModifier = false;
      if (originValue !== metadata.value) {
        isModifier = true;
      }
      // filter for the selected cells that does not have the same value as the origin cell
      const selectedCells = this.selectedCells.filter(cell => {
        return this.tableData[cell.row][`col_${cell.col}`] !== originValue;
      });
      let result: any = {};
      for (let i = 0; i < selectedCells.length; i++) {
        const cell = selectedCells[i];
        let d: any = [];
        let updateMainModifier = true;
        if (i === selectedCells.length - 1) {
          updateMainModifier = false;
        }
        d = this.searchAndUpdateMetadata(
          [{ metadataName: metadata.name, metadataValue: originValue }],
          this.tableData[cell.row],
          cell.col,
          metadata,
          data_type,
          originValue,
          updateMainModifier
        )
        for (const i of d) {
          if (result[i.id]) {
            for (let i2 = 0; i2 < i.modifiers.length; i2++) {
              const resultIndex = result[i.id].modifiers.findIndex((m: any) => m.value === i.modifiers[i2].value);
              if (resultIndex === -1) {
                result[i.id].modifiers.push(i.modifiers[i2])
              } else {
                result[i.id].modifiers[resultIndex].samples = i.modifiers[i2].samples
              }
            }
          } else {
            result[i.id] = i
          }
        }
      }
      this.metadataUpdated.emit(Object.values(result))
      this.originCell = null;
      this.selectionMode = false;
      this.selectedCells = [];
      this.selectionModeColIndex = -1;
    }
  }

  removeMetadataCol(index: number, metadata: MetadataColumn, data_type: "user_metadata" | "staff_metadata") {
    this.removeMetadata.emit({metadata, index, data_type})
  }

  addToFavourite(row: any, col: MetadataColumn, index: number) {
    const ref = this.modal.open(AddFavouriteModalComponent)
    ref.componentInstance.name = col.name
    ref.componentInstance.type = col.type
    ref.componentInstance.value = row[`col_${index}`]
    ref.result.then((result: any) => {
      if (result) {
        this.metadataFavouriteAdded.emit({name: col.name, type: col.type, value: row[`col_${index}`],...result});
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  replaceEntireMetadataColumn(col: MetadataColumn, data_type: "user_metadata" | "staff_metadata") {
    const ref = this.modal.open(MultipleLineInputModalComponent)
    ref.componentInstance.sampleNumber = this.sampleNumber
    ref.result.then((result: string|undefined|null) => {
      if (result) {
        // remove trailing new lines
        result = result.replace(/\n+$/, '')
        const {value, modifiers} = this.metadataService.parseLinesToMetadata(result)
        col.value = value
        col.modifiers = modifiers

        this.metadataUpdated.emit([{...col, data_type: data_type}])
      }
    })

  }

  // Pagination methods
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.saveTableState()
    }
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize
    this.currentPage = 1 // Reset to first page when changing page size
    this.saveTableState()
  }

  goToFirstPage(): void {
    this.currentPage = 1
    this.saveTableState()
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages
    this.saveTableState()
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.saveTableState()
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.saveTableState()
    }
  }

  // State persistence methods
  private loadTableState(): void {
    try {
      const savedState = localStorage.getItem(this.stateKey)
      if (savedState) {
        const state = JSON.parse(savedState)
        
        // Restore pagination state
        if (state.currentPage) {
          this.currentPage = state.currentPage
        }
        if (state.pageSize) {
          this.pageSize = state.pageSize
        }
        
        // Restore scroll position after a brief delay to ensure DOM is ready
        if (state.scrollLeft !== undefined) {
          this.scrollRestoreTimeout = window.setTimeout(() => {
            this.restoreScrollPosition(state.scrollLeft)
          }, 200)
        }
      }
    } catch (error) {
      console.warn('Failed to load table state from localStorage:', error)
    }
  }

  private saveTableState(): void {
    try {
      const scrollLeft = this.tableContainer?.nativeElement?.scrollLeft || 0
      const state = {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
        scrollLeft: scrollLeft,
        timestamp: Date.now()
      }
      localStorage.setItem(this.stateKey, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save table state to localStorage:', error)
    }
  }

  private restoreScrollPosition(scrollLeft: number): void {
    if (this.tableContainer?.nativeElement) {
      this.tableContainer.nativeElement.scrollLeft = scrollLeft
      // Update scroll indicators after restoring position
      this.onTableScroll()
    }
  }

  // Horizontal scroll methods
  onTableScroll(): void {
    if (this.tableContainer) {
      const element = this.tableContainer.nativeElement
      this.canScrollLeft = element.scrollLeft > 0
      this.canScrollRight = element.scrollLeft < (element.scrollWidth - element.clientWidth)
      
      // Cache the scroll progress to prevent ExpressionChangedAfterItHasBeenCheckedError
      const maxScroll = element.scrollWidth - element.clientWidth
      this.scrollProgress = maxScroll <= 0 ? 100 : (element.scrollLeft / maxScroll) * 100
      
      // Save scroll position (with debouncing to avoid excessive saves)
      this.debouncedSaveScrollState()
    }
  }

  private saveScrollTimeout?: number
  private debouncedSaveScrollState(): void {
    if (this.saveScrollTimeout) {
      clearTimeout(this.saveScrollTimeout)
    }
    this.saveScrollTimeout = window.setTimeout(() => {
      this.saveTableState()
    }, 100)
  }

  scrollLeft(): void {
    if (this.tableContainer) {
      const element = this.tableContainer.nativeElement
      element.scrollBy({
        left: -this.scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  scrollRight(): void {
    if (this.tableContainer) {
      const element = this.tableContainer.nativeElement
      element.scrollBy({
        left: this.scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  scrollToStart(): void {
    if (this.tableContainer) {
      const element = this.tableContainer.nativeElement
      element.scrollTo({
        left: 0,
        behavior: 'smooth'
      })
    }
  }

  scrollToEnd(): void {
    if (this.tableContainer) {
      const element = this.tableContainer.nativeElement
      element.scrollTo({
        left: element.scrollWidth,
        behavior: 'smooth'
      })
    }
  }

  getScrollProgress(): number {
    return this.scrollProgress
  }

  // Pool display helper methods
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

  generatePoolSdrfValue(pool: any): string {
    if (!pool || !pool.pooled_only_samples || pool.pooled_only_samples.length === 0) {
      return 'not pooled';
    }
    
    // Generate the SDRF SN= value format using actual source names from samples
    const sourceNames = pool.pooled_only_samples.map((sampleIndex: number) => {
      return this.getSourceNameForSample(sampleIndex);
    });
    return `SN=${sourceNames.join(',')}`;
  }

  private getSourceNameForSample(sampleIndex: number): string {
    // Get the source name from the sample's metadata
    // Look for the source name in the sample's row data
    const sampleRow = this.tableData.find(row => row.sample === sampleIndex);
    if (sampleRow) {
      // Find the source name column index
      const sourceNameColumn = this.userMetadata.findIndex(col => col.name.toLowerCase() === 'source name');
      if (sourceNameColumn !== -1) {
        return sampleRow[`col_${sourceNameColumn}`] || `sample_${sampleIndex}`;
      }
      
      // Also check staff metadata for source name
      const staffSourceNameColumn = this.staffMetadata.findIndex(col => col.name.toLowerCase() === 'source name');
      if (staffSourceNameColumn !== -1) {
        return sampleRow[`col_${this.userMetadata.length + staffSourceNameColumn}`] || `sample_${sampleIndex}`;
      }
    }
    
    // Fallback to generic sample name if source name not found
    return `sample_${sampleIndex}`;
  }

  // Pool metadata editing methods
  moveOverPoolCell(rowIndex: number, colIndex: number) {
    this.currentPoolCell = { row: rowIndex, col: colIndex };
  }

  getPoolMetadataValue(pool: any, metadataName: string): string {
    // Special handling for Source Name (pool name)
    if (metadataName === 'Source name' || metadataName === 'Source Name') {
      return pool.pool_name || '';
    }
    
    // Look for the metadata value in pool's user_metadata and staff_metadata
    if (pool.user_metadata) {
      const userMetadataColumn = pool.user_metadata.find((col: any) => col.name === metadataName);
      if (userMetadataColumn) {
        return userMetadataColumn.value || '';
      }
    }
    
    if (pool.staff_metadata) {
      const staffMetadataColumn = pool.staff_metadata.find((col: any) => col.name === metadataName);
      if (staffMetadataColumn) {
        return staffMetadataColumn.value || '';
      }
    }
    
    return '';
  }

  setPoolMetadataValue(pool: any, metadataName: string, value: string) {
    // Special handling for Source Name (pool name)
    if (metadataName === 'Source name' || metadataName === 'Source Name') {
      pool.pool_name = value;
    }
    
    // Look for the metadata column in pool's user_metadata and staff_metadata
    if (pool.user_metadata) {
      const userMetadataColumn = pool.user_metadata.find((col: any) => col.name === metadataName);
      if (userMetadataColumn) {
        userMetadataColumn.value = value;
        return;
      }
    }
    
    if (pool.staff_metadata) {
      const staffMetadataColumn = pool.staff_metadata.find((col: any) => col.name === metadataName);
      if (staffMetadataColumn) {
        staffMetadataColumn.value = value;
        return;
      }
    }
    
    // If metadata column doesn't exist, we'll need to create it
    // This would typically be handled by the backend when saving
    console.warn(`Metadata column "${metadataName}" not found in pool metadata`);
  }

  editPoolCell(pool: any, poolIndex: number, colIndex: number, metadataName: string) {
    // Use the same modal system as the regular metadata table
    const ref = this.modal.open(JobMetadataCreationModalComponent);
    
    // Handle metadata column editing
    const column = this.userMetadata.find(col => col.name === metadataName) || 
                  this.staffMetadata.find(col => col.name === metadataName);
    
    ref.componentInstance.name = column?.name || metadataName;
    ref.componentInstance.type = column?.type || 'Characteristics';
    ref.componentInstance.value = this.getPoolMetadataValue(pool, metadataName);
    
    ref.componentInstance.sampleNumber = 1; // Pool is treated as a single "sample"
    ref.componentInstance.service_lab_group_id = this.service_lab_group_id;
    
    ref.result.then((result: any) => {
      if (result && result.value !== undefined) {
        this.setPoolMetadataValue(pool, metadataName, result.value);
        
        // Special handling for Source Name (pool name)
        if (metadataName === 'Source name' || metadataName === 'Source Name') {
          pool.pool_name = result.value;
        }
        
        this.toastService.show('Pool Updated', `${metadataName} updated successfully`, 2000, 'success');
      }
    }).catch((error) => {
      console.log('Pool cell edit cancelled');
    });
  }

  editPoolSamples(pool: any, poolIndex: number) {
    // Open the pooled sample modal for editing this specific pool
    this.toastService.show('Edit Pool', 'Opening pool samples editor...', 2000, 'info');
  }

  editPoolColumnDefault(col: any, index: number) {
    // Edit default value for a pool metadata column using the same modal system
    const ref = this.modal.open(JobMetadataCreationModalComponent);
    
    ref.componentInstance.name = col.name;
    ref.componentInstance.type = col.type;
    ref.componentInstance.value = col.value || '';
    ref.componentInstance.sampleNumber = 1;
    ref.componentInstance.service_lab_group_id = this.service_lab_group_id;
    
    ref.result.then((result: any) => {
      if (result && result.value !== undefined) {
        col.value = result.value;
        this.toastService.show('Column Updated', `Default value for ${col.name} updated`, 2000, 'success');
        
        // Apply the new default to all existing pools that don't have a value for this column
        this.existingPools.forEach(pool => {
          if (!this.getPoolMetadataValue(pool, col.name)) {
            this.setPoolMetadataValue(pool, col.name, result.value);
          }
        });
      }
    }).catch((error) => {
      console.log('Column default edit cancelled');
    });
  }

  addPoolToFavourite(pool: any, col: any, index: number) {
    const value = this.getPoolMetadataValue(pool, col.name);
    const ref = this.modal.open(AddFavouriteModalComponent);
    ref.componentInstance.name = col.name;
    ref.componentInstance.type = col.type;
    ref.componentInstance.value = value;
    ref.result.then((result: any) => {
      if (result) {
        this.metadataFavouriteAdded.emit({
          name: col.name,
          type: col.type,
          value: value,
          ...result
        });
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // Pool selection mode methods (similar to regular metadata table)
  copyPoolCellAndEnableSelectionMode(pool: any, poolIndex: number, colIndex: number, metadataName: string) {
    this.currentPoolCell = { row: poolIndex, col: colIndex };
    this.poolSelectionMode = true;
    this.poolSelectionModeColIndex = colIndex;
    this.poolOriginCell = { row: poolIndex, col: colIndex };
    this.selectedPoolCells = [{ row: poolIndex, col: colIndex }];
  }

  isSelectedPoolCell(rowIndex: number, colIndex: number): boolean {
    return this.selectedPoolCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
  }

  selectPoolCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number) {
    this.selectedPoolCells = [];
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    
    // Only select cells in the same column for pool metadata
    if (startCol === endCol) {
      for (let row = minRow; row <= maxRow; row++) {
        this.selectedPoolCells.push({ row, col: startCol });
      }
    }
  }

  pastePoolContentFromOriginToCells(metadataName: string) {
    if (this.poolOriginCell) {
      const originPool = this.existingPools[this.poolOriginCell.row];
      const originValue = this.getPoolMetadataValue(originPool, metadataName);
      
      // Apply the value to all selected cells
      this.selectedPoolCells.forEach(cell => {
        const targetPool = this.existingPools[cell.row];
        if (targetPool && cell.row !== this.poolOriginCell!.row) {
          this.setPoolMetadataValue(targetPool, metadataName, originValue);
          
          // Special handling for Source Name (pool name)
          if (metadataName === 'Source name' || metadataName === 'Source Name') {
            targetPool.pool_name = originValue;
          }
        }
      });
      
      this.toastService.show('Pools Updated', `${metadataName} copied to ${this.selectedPoolCells.length} pools`, 2000, 'success');
      this.exitPoolSelectionMode();
    }
  }

  exitPoolSelectionMode() {
    this.poolOriginCell = null;
    this.poolSelectionMode = false;
    this.selectedPoolCells = [];
    this.poolSelectionModeColIndex = -1;
  }

  replaceEntirePoolMetadataColumn(col: any, metadataName: string) {
    // Use the MultipleLineInputModal for bulk editing pool metadata
    const ref = this.modal.open(MultipleLineInputModalComponent);
    ref.componentInstance.sampleNumber = this.existingPools.length;
    ref.result.then((result: string | undefined | null) => {
      if (result) {
        const lines = result.trim().split('\n');
        this.existingPools.forEach((pool, index) => {
          if (index < lines.length) {
            const value = lines[index].trim();
            this.setPoolMetadataValue(pool, metadataName, value);
          }
        });
        this.toastService.show('Pools Updated', `${metadataName} updated for all pools`, 2000, 'success');
      }
    });
  }

  copyPoolSdrfValue(pool: any) {
    const sdrfValue = this.generatePoolSdrfValue(pool);
    navigator.clipboard.writeText(sdrfValue).then(() => {
      this.toastService.show('Copied', 'SDRF value copied to clipboard', 2000, 'success');
    }).catch(() => {
      this.toastService.show('Error', 'Failed to copy to clipboard', 2000, 'error');
    });
  }

  deletePool(pool: any, poolIndex: number) {
    if (confirm(`Are you sure you want to delete the pool "${pool.pool_name || 'Pool ' + (poolIndex + 1)}"? This action cannot be undone.`)) {
      // Clear any selection mode related to this pool
      this.exitPoolSelectionMode();
      
      // Emit an event to notify parent component about the deletion
      // The parent component will handle the actual backend call and UI updates
      this.poolDeleted.emit(pool);
    }
  }

  private parseSampleRange(input: string): number[] {
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

}
