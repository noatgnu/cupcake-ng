import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {MetadataColumn} from "../../../../metadata-column";
import {
  DisplayModificationParametersMetadataComponent
} from "../../../../display-modification-parameters-metadata/display-modification-parameters-metadata.component";
import {NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {
  JobMetadataCreationModalComponent
} from "../../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {FormArray} from "@angular/forms";

@Component({
  selector: 'app-metadata-table',
  imports: [
    DisplayModificationParametersMetadataComponent,
    NgbTooltip
  ],
  templateUrl: './metadata-table.component.html',
  styleUrl: './metadata-table.component.scss'
})
export class MetadataTableComponent implements OnChanges{
  @Input() sampleNumber: number = 0

  @Input() userMetadata: MetadataColumn[] = []

  @Input() staffMetadata: MetadataColumn[] = []

  @Input() staffModeActive: boolean = false

  tableData: any[] = []

  @Output() metadataUpdated: EventEmitter<any[]> = new EventEmitter<any[]>()

  ngOnChanges(changes: SimpleChanges) {
    if (changes["sampleNumber"] || changes["userMetadata"] || changes["staffMetadata"]) {
      this.generateTableData()
    }
  }

  constructor(private modal: NgbModal) {

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
                data_type: data_type
              }
              const modifiers = [...metadata.modifiers];
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
                metadata.modifiers = modifiers;
              }
            }
          } else {
            const data: any = {
              name: metadata.name,
              value: metadata.value,
              type: metadata.type,
              id: metadata.id,
              data_type: data_type
            }
            const modifiers = [...metadata.modifiers];

            let found_in_modifiers = false;
            for (const m of metadata.modifiers) {
              if (m.value === oldValue && m.value !== value) {
                const sampleIndices = this.parseSampleRanges(m.samples);
                // remove sample index from the modifier that has the same value as the old value
                const newSampleIndices = sampleIndices.filter(i => i !== row.sample);
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
            metadata.modifiers = modifiers;
          }
        }
        this.metadataUpdated.emit(d)
      }
    }).catch((error) => {
      console.log(error)
    })

  }

  editDefaultMetadataValue(metadata: MetadataColumn, data_type: 'user_metadata' | 'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent)
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
            data_type: data_type
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
}
