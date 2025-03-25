import {Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {MetadataColumn} from "../../../../metadata-column";
import {
  DisplayModificationParametersMetadataComponent
} from "../../../../display-modification-parameters-metadata/display-modification-parameters-metadata.component";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {
  JobMetadataCreationModalComponent
} from "../../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {FormArray} from "@angular/forms";
import {NgClass} from "@angular/common";
import {AddFavouriteModalComponent} from "../../../../add-favourite-modal/add-favourite-modal.component";
import {
  MultipleLineInputModalComponent
} from "../../../../multiple-line-input-modal/multiple-line-input-modal.component";
import {MetadataService} from "../../../../metadata.service";

@Component({
  selector: 'app-metadata-table',
  imports: [
    NgbTooltip,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgClass
  ],
  templateUrl: './metadata-table.component.html',
  styleUrl: './metadata-table.component.scss'
})
export class MetadataTableComponent implements OnChanges{
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

  tableData: any[] = []

  @Output() metadataUpdated: EventEmitter<any[]> = new EventEmitter<any[]>()
  @Output() removeMetadata: EventEmitter<{ metadata: MetadataColumn, index: number, data_type: 'user_metadata'|'staff_metadata' }> = new EventEmitter<{ metadata: MetadataColumn, index: number, data_type: 'user_metadata'|'staff_metadata' }>()
  @Output() metadataFavouriteAdded: EventEmitter<any> = new EventEmitter<any>()
  selectedCells: { row: number, col: number }[] = [];
  isShiftSelecting: boolean = false;

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
    }
  }

  constructor(private modal: NgbModal, public metadataService: MetadataService) {

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
            auto_generated: r.auto_generated,
            readonly: r.readonly
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
}
