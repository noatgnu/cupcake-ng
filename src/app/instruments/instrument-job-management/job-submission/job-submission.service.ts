import {EventEmitter, Injectable} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {MetadataService} from "../../../metadata.service";
import {InstrumentJob} from "../../../instrument-job";
import {JobMetadataCreationModalComponent} from "../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {MetadataColumn} from "../../../metadata-column";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AddFavouriteModalComponent} from "../../../add-favourite-modal/add-favourite-modal.component";
import {ToastService} from "../../../toast.service";

@Injectable({
  providedIn: 'root'
})
export class JobSubmissionService {
  metadata = this.fb.group({
    user_metadata: this.fb.array<FormGroup<{
      id: FormControl<number>;
      value: FormControl<string>;
      name: FormControl<string>;
      type: FormControl<string>;
      mandatory: FormControl<boolean>;
      modifiers: FormControl<{samples: string, value: string}[]>;
      hidden: FormControl<boolean>;
      readonly: FormControl<boolean>;
    }>>([]),
    staff_metadata: this.fb.array<FormGroup<{
      id: FormControl<number>;
      value: FormControl<string>;
      name: FormControl<string>;
      type: FormControl<string>;
      mandatory: FormControl<boolean>;
      modifiers: FormControl<{samples: string, value: string}[]>;
      hidden: FormControl<boolean>;
      readonly: FormControl<boolean>;
    }>>([])
  })

  updateSubject = new EventEmitter<boolean>();

  constructor(private fb: FormBuilder, private metadataService: MetadataService, private modal: NgbModal, private toast: ToastService) { }

  handleMetadataUpdated(event: {
    name:string,
    value: string,
    type: string,
    id: number,
    data_type: string,
    modifiers: {samples: string, value: string}[],
    hidden: boolean,
    readonly: boolean,
  }[]) {
    for (const metadata of event) {
      if (metadata.data_type === "user_metadata") {
        const formArray = this.metadata.get('user_metadata') as FormArray;
        this.updateMetadataFormArray(formArray, metadata);
      } else if (metadata.data_type === "staff_metadata") {
        const formArray = this.metadata.get('staff_metadata') as FormArray;
        this.updateMetadataFormArray(formArray, metadata);
      }
    }
    this.updateSubject.next(true)
  }

  private updateMetadataFormArray(formArray: FormArray<any>, metadata: {
    name: string;
    value: string;
    type: string;
    id: number;
    data_type: string;
    modifiers: { samples: string; value: string }[],
    hidden: boolean;
    readonly: boolean;
  }) {
    console.log(metadata)
    for (const f of formArray.controls) {
      if (f.value.id === metadata.id) {
        if (f.value.hidden !== metadata.hidden) {
          f.patchValue({
            hidden: metadata.hidden,
          })
          formArray.markAsDirty()
        }
        if (f.value.readonly !== metadata.readonly) {
          f.patchValue({
            readonly: metadata.readonly,
          })
          formArray.markAsDirty()
        }
        if (f.value.value !== metadata.value) {
          f.patchValue({
            value: metadata.value,
          })
          formArray.markAsDirty()
        } else {
          if (!f.value.modifiers) {
            f.patchValue({
              modifiers: metadata.modifiers,
            })
            formArray.markAsDirty()
          } else {
            if (metadata.modifiers) {
              for (const modifier of metadata.modifiers) {
                if (f.value.modifiers) {
                  const found = f.value.modifiers.find((m: any) => m.value === modifier.value)
                  if (!found) {
                    const newModifiers = f.value.modifiers
                    newModifiers.push(modifier)
                    f.patchValue({
                      modifiers: newModifiers
                    })
                    formArray.markAsDirty()
                  } else {
                    if (found.samples !== modifier.samples) {
                      // replace samples value with new value
                      const newModifiers = f.value.modifiers
                      newModifiers[newModifiers.indexOf(found)].samples = modifier.samples
                      f.patchValue({
                        modifiers: newModifiers
                      })
                      formArray.markAsDirty()
                    }
                  }
                }
              }
              for (const modifier of f.value.modifiers) {
                const found = metadata.modifiers.find((m: any) => m.value === modifier.value)
                if (!found) {
                  const newModifiers = f.value.modifiers.filter((m: any) => m.value !== modifier.value)
                  f.patchValue({
                    modifiers: newModifiers
                  })
                  formArray.markAsDirty()
                }
              }
            }
          }
        }
      }
    }
  }

  editMetadata(index: number, arrayName: 'user_metadata'|'staff_metadata', job: InstrumentJob) {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    const metadata = (this.metadata.get(arrayName) as FormArray).controls[index].value
    if (job){
      ref.componentInstance.service_lab_group_id = job.service_lab_group?.id
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
        const formArray = this.metadata.get(arrayName) as FormArray;
        for (const r of result) {
          let value = r.metadataValue
          value = this.metadataService.tranformMetadataValue(r, value);
          formArray.controls[index].patchValue({
            value: value,
            hidden: r.hidden,
            readonly: r.read_only,
          })

        }
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  addMetadata(metadata: {name: string, type: string}, arrayName: 'user_metadata'|'staff_metadata', job: InstrumentJob) {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    if (job){
      ref.componentInstance.service_lab_group_id = job.service_lab_group?.id
      if (metadata.type === "Factor value") {
        ref.componentInstance.possibleColumns = [...job.user_metadata, ...job.staff_metadata].filter((m) => m.type !== "Factor value")
      }
    }
    ref.componentInstance.name = metadata.name
    // capitalize first letter
    ref.componentInstance.type = metadata.type.charAt(0).toUpperCase() + metadata.type.slice(1)


    ref.closed.subscribe((result: any[]) => {
      if (result) {
        const formArray = this.metadata.get(arrayName) as FormArray;

        for (const r of result) {
          if (r.type !== 'Factor value') {
            let value = r.metadataValue
            value = this.metadataService.tranformMetadataValue(r, value);
            let group: any = {}
            if (metadata.name !== "") {
              group = this.fb.group({
                name: metadata.name,
                type: metadata.type,
                value: value,
                mandatory: false,
                id: null,
                hidden: r.hidden,
                readonly: r.readonly
              })
            } else {
              if (r.charateristic) {
                r.metadataType = "Characteristics"
              } else {
                r.metadataType = "Comment"
              }
              group = this.fb.group({
                name: r.metadataName,
                type: r.metadataType,
                value: value,
                mandatory: false,
                id: null,
                hidden: r.hidden,
                readonly: r.readonly
              })
            }
            formArray.push(group);
            this.subscribeToFormGroupChanges(group)
          } else {
            if (job) {
              const selectedFactorValueColumn = [...job.user_metadata, ...job.staff_metadata].find((c: MetadataColumn) => c.name === r.metadataValue && c.type !== "Factor value")
              if (selectedFactorValueColumn) {
                const group = this.fb.group({
                  name: selectedFactorValueColumn.name,
                  type: 'Factor value',
                  value: selectedFactorValueColumn.value,
                  mandatory: false,
                  id: null,
                  modifiers: selectedFactorValueColumn.modifiers,
                  hidden: selectedFactorValueColumn.hidden,
                  readonly: selectedFactorValueColumn.readonly,
                })
                formArray.push(group);
                this.subscribeToFormGroupChanges(group)
              }
            }
          }
        }
        formArray.markAsDirty()
        this.updateSubject.next(true)
      }
    })
  }

  addMetadataModifier(index: number, arrayName: 'user_metadata'|'staff_metadata', job: InstrumentJob) {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    const metadata = (this.metadata.get(arrayName) as FormArray).controls[index].value
    if (job){
      ref.componentInstance.service_lab_group_id = job.service_lab_group?.id
    }
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    ref.componentInstance.value = metadata.value
    ref.componentInstance.allowMultipleSpecSelection = false
    ref.componentInstance.modifier = true


    ref.result.then((result: any[]) => {
      if (result) {
        for (const r of result) {
          let value = r.metadataValue
          value = this.metadataService.tranformMetadataValue(r, value);
          const currentModifiers = (this.metadata.get(arrayName) as FormArray).controls[index].value['modifiers']
          if (currentModifiers) {
            currentModifiers.push({samples: r["samples"], value: value})
            (this.metadata.get(arrayName) as FormArray).controls[index].patchValue({
              modifiers: currentModifiers
            })
          } else {
            (this.metadata.get(arrayName) as FormArray).controls[index].patchValue({
              modifiers: [{samples: r["samples"], value: value}]
            })
          }
          (this.metadata.get(arrayName) as FormArray).markAsDirty()
        }
      }
    })
  }


  removeMetadataModifier(index: number, modifierIndex: number, arrayName: 'user_metadata'|'staff_metadata') {
    const formArray = this.metadata.get(arrayName) as FormArray;
    const modifiers = formArray.controls[index].value['modifiers']
    modifiers.splice(modifierIndex, 1)
    formArray.controls[index].patchValue({
      modifiers: modifiers
    })
    formArray.markAsDirty()
  }

  editMetadataModifier(index: number, modifierIndex: number, arrayName: 'user_metadata'|'staff_metadata', job: InstrumentJob) {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    const metadata = (this.metadata.get(arrayName) as FormArray).controls[index].value
    const modifier = metadata['modifiers'][modifierIndex]
    if (job){
      ref.componentInstance.service_lab_group_id = job.service_lab_group?.id
    }
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    ref.componentInstance.value = modifier.value
    ref.componentInstance.allowMultipleSpecSelection = false
    ref.componentInstance.modifier = true
    ref.componentInstance.samples = modifier.samples

    ref.result.then((result: any[]) => {
      if (result) {
        for (const r of result) {
          let value = r.metadataValue
          value = this.metadataService.tranformMetadataValue(r, value);
          const currentModifiers = (this.metadata.get(arrayName) as FormArray).controls[index].value['modifiers']
          // @ts-ignore
          currentModifiers[modifierIndex] = {samples: r["samples"], value: value}
          (this.metadata.get(arrayName) as FormArray).controls[index].patchValue({
            modifiers: currentModifiers
          });

          (this.metadata.get(arrayName) as FormArray).markAsDirty()
        }
      }
    })
  }

  removeMetadata(index: number, arrayName: 'user_metadata'|'staff_metadata') {
    const formArray = this.metadata.get(arrayName) as FormArray;
    formArray.removeAt(index);
    formArray.markAsDirty()
    this.updateSubject.next(true)
  }

  addToFavourite(name: string|undefined, type: string|undefined, value: string|undefined) {
    const ref = this.modal.open(AddFavouriteModalComponent)
    ref.componentInstance.name = name
    ref.componentInstance.type = type
    ref.componentInstance.value = value
    ref.result.then((result: any) => {
      if (result) {
        // @ts-ignore
        this.metadataService.addMetadataToFavourite(name, type, value, result.display_name, result.mode, result.lab_group).subscribe((response) => {
          this.toast.show("Favourite", "Favourite option added")
        })
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  setMetadataFormArray(arrayName: string, metadata: any[]): void {
    const formArray: FormArray<FormGroup<{
      id: FormControl<number>;
      value: FormControl<string>;
      name: FormControl<string>;
      type: FormControl<string>;
      mandatory: FormControl<boolean>;
      modifiers: FormControl<{samples: string, value: string}[]>;
      hidden: FormControl<boolean>;
      readonly: FormControl<boolean>;
    }>> = this.fb.array<FormGroup>([]);
    for (const m of metadata) {
      const group: FormGroup<{
        id: FormControl<number>;
        value: FormControl<string>;
        name: FormControl<string>;
        type: FormControl<string>;
        mandatory: FormControl<boolean>;
        modifiers: FormControl<{samples: string, value: string}[]>;
        hidden: FormControl<boolean>;
        readonly: FormControl<boolean>;
      }> = this.fb.group({
        id: new FormControl(m.id) ,
        value: new FormControl(m.value),
        name: new FormControl(m.name),
        type: new FormControl(m.type),
        mandatory: new FormControl(m.mandatory),
        modifiers: new FormControl(m.modifiers),
        hidden: new FormControl(m.hidden),
        readonly: new FormControl(m.readonly),
      });
      formArray.push(group);
      this.subscribeToFormGroupChanges(group);
    }
    // @ts-ignore
    this.metadata.setControl(arrayName, formArray);
  }

  subscribeToFormArrayChanges(formArray: FormArray): void {
    // @ts-ignore
    formArray.controls.forEach((formGroup: FormGroup) => {
      this.subscribeToFormGroupChanges(formGroup);
    });
  }

  subscribeToFormGroupChanges(formGroup: FormGroup): void {
    formGroup.valueChanges.subscribe((changes) => {
      console.log('FormGroup changes:', changes);
    });
  }

  createFormArrays(value: InstrumentJob) {
    this.setMetadataFormArray('user_metadata', value.user_metadata);
    this.setMetadataFormArray('staff_metadata', value.staff_metadata);
    console.log("create form arrays", this.metadata)
  }


}
