import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {InstrumentJob} from "../../../instrument-job";
import {WebService} from "../../../web.service";
import {
  NgbDropdown, NgbDropdownItem,
  NgbDropdownMenu, NgbDropdownToggle, NgbModal,
  NgbTooltip,
  NgbTypeahead,
  NgbTypeaheadSelectItemEvent
} from "@ng-bootstrap/ng-bootstrap";
import {Observable, debounceTime, distinctUntilChanged, switchMap, map, catchError, of, tap} from 'rxjs';
import {Project} from "../../../project";
import {DatePipe} from "@angular/common";
import {Unimod} from "../../../unimod";
import {ToastService} from "../../../toast.service";
import {Protocol} from "../../../protocol";
import {QuillEditorComponent, QuillViewComponent} from "ngx-quill";
import {StorageObject, StoredReagent} from "../../../storage-object";
import {LabGroup, LabGroupQuery} from "../../../lab-group";
import {UserQuery} from "../../../user";
import {MetadataService} from "../../../metadata.service";
import {JobMetadataCreationModalComponent} from "../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {
  AnnotationPresenterComponent
} from "../../../protocol-session/annotation-presenter/annotation-presenter.component";
import {AnnotationService} from "../../../annotation.service";

@Component({
  selector: 'app-job-submission',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    DatePipe,
    NgbTooltip,
    QuillEditorComponent,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    AnnotationPresenterComponent,
    NgbDropdownItem
  ],
  templateUrl: './job-submission.component.html',
  styleUrl: './job-submission.component.scss'
})
export class JobSubmissionComponent implements OnInit {
  currentForm: FormGroup|undefined
  selectedProject: Project|undefined
  selectedProtocol: Protocol|undefined
  selectedStoredReagent: StoredReagent|undefined
  private _job: InstrumentJob|undefined
  projectSearchLoading = false
  protocolSearchLoading = false
  storedReagentSearchLoading = false
  searchMetadataLoading = false
  selectedGroup: LabGroup | undefined



  @Input() set job(value: InstrumentJob|undefined) {
    this._job = value
    console.log(value)
    if (value) {
      // @ts-ignore
      this.form.patchValue({job_name: value.job_name, staff: value.staff.map(s => s.id), status: value.status})
      this.formSampleExtraData.patchValue({
        sample_type: value.sample_type,
        sample_number: value.sample_number
      })
      if (value.service_lab_group) {
        // @ts-ignore
        this.labGroupForm.patchValue({name: value.service_lab_group.name, selected: value.service_lab_group.id})
        this.web.getLabGroup(value.service_lab_group.id).subscribe((labGroup) => {
          this.selectedGroup = labGroup
          if (labGroup.service_storage) {
            this.service_storage = labGroup.service_storage
          }
        })
      }
      this.fundingForm.patchValue({
        cost_center: value.cost_center,
        funder: value.funder,
      })
      if (value.stored_reagent) {
        // @ts-ignore
        this.reagentForm.patchValue({id: value.stored_reagent.id,
          name: value.stored_reagent.reagent.name,
          current_quantity: value.stored_reagent.quantity,
          unit: value.stored_reagent.reagent.unit
        })
        this.web.getStoredReagent(value.stored_reagent.id).subscribe((reagent) => {
          this.selectedStoredReagent = reagent
        })
      }
      if (value.protocol) {
        // @ts-ignore
        this.protocolForm.patchValue({id: value.protocol.id,
          protocol_title: value.protocol.protocol_title,
          protocol_description: value.protocol.protocol_description
        })

        this.web.getProtocol(value.protocol.id).subscribe((protocol) => {
          this.selectedProtocol = protocol
        })
      }
      this.web.getProject(value.project.id).subscribe((project) => {
        this.selectedProject = project
        // @ts-ignore
        this.projectForm.patchValue({id: project.id,
          project_name: project.project_name,
          project_description: project.project_description
        })
      })
      this.setMetadataFormArray('user_metadata', value.user_metadata);
      this.setMetadataFormArray('staff_metadata', value.staff_metadata);
    }
  }
  get job(): InstrumentJob|undefined {
    return this._job
  }

  form = this.fb.group({
    job_name: ['', Validators.required],
    staff: [[]],
    status: [''],
  })

  formSampleExtraData = this.fb.group({
    sample_type: ['',],
    sample_number: [0,],
  })

  fundingForm = this.fb.group({
    cost_center: ['',],
    funder: ['',],
  })


  projectForm = this.fb.group({
    project_name: ['', Validators.required],
    project_description: ['', Validators.required],
    id: [null]
  })

  protocolForm = this.fb.group({
    protocol_title: ['', Validators.required],
    protocol_description: ['', Validators.required],
    id: [null]
  })

  metadata = this.fb.group({
    user_metadata: this.fb.array<FormGroup>([]),
    staff_metadata: this.fb.array<FormGroup>([])
  })

  reagentForm = this.fb.group({
    name: ['', ],
    id: [null],
    current_quantity: [0,],
    unit: ['ug',],
    use_previous: [true],
  })

  editorConfig = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'align': [] }],

        ['clean'],                                         // remove formatting button

        ['link', 'image', 'video']                         // link and image, video
      ]
    }
  }

  labGroupForm = this.fb.group({
    name: [''],
    selected: [null]
  })

  labGroupQuery: LabGroupQuery | undefined
  defaultLabGroup: string = 'MS Facility'
  labGroupUserQuery: UserQuery | undefined

  labUserMemberPage = 0
  labUserMemberPageSize = 10
  service_storage: StorageObject|undefined|null

  constructor(public annotationService: AnnotationService, private modal: NgbModal, private fb: FormBuilder, private web: WebService, private toast: ToastService, public metadataService: MetadataService) {
    this.annotationService.refreshAnnotation.asObservable().subscribe((value) => {
      if (this.job) {
        this.web.getInstrumentJob(this.job.id).subscribe((job) => {
          this.job = job
        })
      }

    })
    this.labGroupForm.patchValue({name: this.defaultLabGroup})
    this.web.getLabGroups(this.defaultLabGroup).subscribe((labGroup) => {
      this.labGroupQuery = labGroup
      if (labGroup.results.length > 0) {
        if (!this.labGroupForm.value.selected) {
          // @ts-ignore
          this.labGroupForm.patchValue({selected: labGroup.results[0].id})
          this.service_storage = labGroup.results[0].service_storage
          this.selectedGroup = labGroup.results[0]
          this.web.getUsersByLabGroup(labGroup.results[0].id).subscribe((users) => {
            this.labGroupUserQuery = users
          })
        }
      }
    })
    this.labGroupForm.controls.selected.valueChanges.subscribe((value) => {
      if (value) {
        this.web.getLabGroup(value).subscribe((labGroup) => {
          this.selectedGroup = labGroup
          if (this.service_storage) {
            this.service_storage = labGroup.service_storage
          }
        })
        this.web.getUsersByLabGroup(value, this.labUserMemberPageSize, this.labUserMemberPage).subscribe((users) => {
          this.labGroupUserQuery = users
        })
      }
    })
  }

  onUserMemberPageChange(page: number) {
    this.labUserMemberPage = page
    // @ts-ignore
    this.web.getUsersByLabGroup(this.labGroupForm.value.selected, this.labUserMemberPageSize, this.labUserMemberPage).subscribe((users) => {
      this.labGroupUserQuery = users
    })
  }

  formatter = (result: any) => result.project_name;
  searchProjects = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      tap(() => this.projectSearchLoading = true),
      distinctUntilChanged(),
      switchMap(term =>
        this.web.getProjects(undefined, 10, 0, term).pipe(
          map(response => {
            this.projectSearchLoading = false;
            return response.results || []
          }),
          catchError(() => {
            this.projectSearchLoading = false;
            return of([])
          })
        )
      )
    );
  protocolFormatter = (result: any) => result.protocol_title;
  searchProtocol = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      tap(() => this.protocolSearchLoading = true),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }
        return this.web.getUserProtocols(undefined, 5, 0, value).pipe(
          map((response) => {
            this.protocolSearchLoading = false;
            return response.results || []
          }), catchError(() => {
            this.protocolSearchLoading = false;
            return of([]);
          })
        );
      })
    )
  }
  reagentFormatter = (result: StoredReagent) => {
    if (typeof result === 'string') {
      return result
    }
    if (result) {
      return result.reagent.name
    } else {
      return ''
    }
  }

  searchReagent = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      tap(() => this.storedReagentSearchLoading = true),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }
        if (this.labGroupForm.value.selected && this.service_storage) {
          return this.web.getStoredReagents(undefined, 5, 0, value, this.service_storage.id, null, true).pipe(
            map((response) => {
              this.storedReagentSearchLoading = false;
              return response.results || [];
            }), catchError(() => {
              this.storedReagentSearchLoading = false;
              return of([]);
            })
          );
        } else {
          return of([]);
        }
      })
    );
  }

  onProjectSelected(event: NgbTypeaheadSelectItemEvent): void {
    const project = event.item;
    this.selectedProject = project;
    this.projectForm.patchValue({
      id: project.id,
      project_name: project.project_name,
      project_description: project.project_description
    });
  }

  onProtocolSelected(event: NgbTypeaheadSelectItemEvent): void {
    const protocol = event.item;
    this.selectedProtocol = protocol;
    this.protocolForm.patchValue({
      id: protocol.id,
      protocol_title: protocol.protocol_title,
      protocol_description: protocol.protocol_description
    });
  }

  onStoredReagentSelected(event: NgbTypeaheadSelectItemEvent): void {
    const reagent = event.item;
    console.log(reagent)
    this.selectedStoredReagent = reagent;
    this.reagentForm.patchValue({
      id: reagent.id,
      name: reagent.reagent.name,
      current_quantity: reagent.quantity,
      unit: reagent.reagent.unit
    });
  }

  createDraftJob() {
    if (this.projectForm.valid && this.form.valid) {
      if (this.selectedProject) {
        // @ts-ignore
        this.web.createInstrumentJob(this.form.value.job_name, this.selectedProject.id).subscribe((response) => {
          this.job = response
          this.web.getProject(response.project.id).subscribe((project) => {
            this.selectedProject = project
          })
        })
      } else {
        // @ts-ignore
        this.web.createProject(this.projectForm.value.project_name, this.projectForm.value.project_description).subscribe((response) => {
          this.selectedProject = response
          // @ts-ignore
          this.projectForm.patchValue({id: response.id,
            project_name: response.project_name,
            project_description: response.project_description
          })
          // @ts-ignore
          this.web.createInstrumentJob(this.form.value.job_name, response.id).subscribe((response) => {
            this.job = response
            this.web.getProject(response.project.id).subscribe((project) => {
              this.selectedProject = project
            })
          })
        })
      }
    }
  }

  ngOnInit(): void {
    this.subscribeToFormArrayChanges(this.metadata.get('user_metadata') as FormArray);
    this.subscribeToFormArrayChanges(this.metadata.get('staff_metadata') as FormArray);
  }

  setMetadataFormArray(arrayName: string, metadata: any[]): void {
    const formArray = this.fb.array<FormGroup>([]);
    for (const m of metadata) {
      const group = this.fb.group({
        id: m.id,
        value: m.value,
        name: m.name,
        type: m.type,
        mandatory: m.mandatory
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



  searchValue = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      tap(() => this.searchMetadataLoading = true),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }

        let name = this.currentForm?.get('name')?.value;
        if (!name) {
          this.searchMetadataLoading = false;
          return of([]);
        }
        name = name.toLowerCase();
        return this.metadataService.metadataTypeAheadDataGetter(name, value).pipe(
          map(results => {
            this.searchMetadataLoading = false;
            return results;
          }), catchError(() => {
            this.searchMetadataLoading = false;
            return of([]);
          })
        )

      })
    );
  }

  setCurrentForm(form: FormGroup) {
    this.currentForm = form;
  }

  async update() {
    if (this.job) {
      if (!this.protocolForm.value.id) {
        // @ts-ignore
        const protocol = await this.web.createProtocol(this.protocolForm.value.protocol_title, this.protocolForm.value.protocol_description).toPromise()
        if (protocol) {
          // @ts-ignore
          this.protocolForm.patchValue({id: protocol.id, protocol_title: protocol.protocol_title, protocol_description: protocol.protocol_description})
          this.selectedProtocol = protocol
        }
      }
      if (this.labGroupForm.valid && this.labGroupForm.value.selected) {
        const selectedLabGroup = await this.web.getLabGroup(this.labGroupForm.value.selected).toPromise()
        if (!this.reagentForm.value.id) {
          if (this.reagentForm.value.name) {
            if (this.labGroupForm.valid && this.labGroupForm.value.selected) {
              if (selectedLabGroup) {
                if (selectedLabGroup.service_storage) {
                  // @ts-ignore
                  const reagent = await this.web.createStoredReagent(selectedLabGroup.service_storage.id, this.reagentForm.value.name, this.reagentForm.value.unit, this.reagentForm.value.current_quantity, `Added from job with id ${this.job.id}`, null, false, false, this.projectForm.value.id, this.protocolForm.value.id).toPromise()
                  if (reagent) {
                    // @ts-ignore
                    this.reagentForm.patchValue({id: reagent.id, name: reagent.reagent.name, current_quantity: reagent.quantity, unit: reagent.reagent.unit})
                  }
                }
              }
            }
          }
        } else {
          const selectedLabGroup = await this.web.getLabGroup(this.labGroupForm.value.selected).toPromise()
          if (selectedLabGroup) {
            if (selectedLabGroup.service_storage) {
              // @ts-ignore
              const reagent = await this.web.createStoredReagent(selectedLabGroup.service_storage.id, this.reagentForm.value.name, this.reagentForm.value.unit, this.reagentForm.value.current_quantity, `Added from job with id${this.job.id}`, null, false, false, this.projectForm.value.id, this.protocolForm.value.id).toPromise()
              if (reagent) {
                // @ts-ignore
                this.reagentForm.patchValue({id: reagent.id, name: reagent.reagent.name, current_quantity: reagent.quantity, unit: reagent.reagent.unit})
              }
            }
          }
        }
      } else {
        await this.toast.show('Lab Group', 'Please select a lab group before update with reagent information');
      }
      // @ts-ignore
      const staffIds = this.form.value.staff.map((s) => s)
      const userMetadata = (this.metadata.get('user_metadata') as FormArray).controls.map((c) => c.value)
      console.log(this.labGroupForm.value.selected)
      // @ts-ignore
      const response = await this.web.updateInstrumentJob(this.job.id, this.form.value.job_name, this.projectForm.value.id, this.fundingForm.value.cost_center, this.fundingForm.value.funder, this.formSampleExtraData.value.sample_type, this.formSampleExtraData.value.sample_number, this.protocolForm.value.id, staffIds, this.reagentForm.value.id, userMetadata, [], this.labGroupForm.value.selected).toPromise()
      if (response) {
         await this.toast.show('Job', 'Job updated successfully');
        this.job = response
      }
    }
  }

  addMetadata(metadata: {name: string, type: string}, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    ref.closed.subscribe((result: any[]) => {
      if (result) {
        const formArray = this.metadata.get(arrayName) as FormArray;
        for (const r of result) {
          let value = r.metadataValue
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
          const group = this.fb.group({
            name: metadata.name,
            type: metadata.type,
            value: value,
            mandatory: false,
            id: null
          })
          formArray.push(group);
          this.subscribeToFormGroupChanges(group)
        }
      }
    })
  }

  removeMetadata(index: number, arrayName: 'user_metadata'|'staff_metadata') {
    const formArray = this.metadata.get(arrayName) as FormArray;
    formArray.removeAt(index);
  }

  checkMetadataAdd() {

  }

  editMetadata(index: number, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    const metadata = (this.metadata.get(arrayName) as FormArray).controls[index].value
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
          formArray.controls[index].patchValue({
            value: value
          })
          console.log(formArray.controls[index].value)

        }
      }
    }).catch((error) => {
      console.log(error)
    })
  }
}
