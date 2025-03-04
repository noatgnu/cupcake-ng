import {AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {
  Form,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {InstrumentJob} from "../../../instrument-job";
import {WebService} from "../../../web.service";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet,
  NgbOffcanvas,
  NgbTooltip,
  NgbTypeahead,
  NgbTypeaheadSelectItemEvent
} from "@ng-bootstrap/ng-bootstrap";
import {Observable, debounceTime, distinctUntilChanged, switchMap, map, catchError, of, tap} from 'rxjs';
import {Project} from "../../../project";
import {DatePipe, NgClass} from "@angular/common";
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
import {
  AnnotationTextFormComponent
} from "../../../protocol-session/annotation-text-form/annotation-text-form.component";
import {
  HandwrittenAnnotationComponent
} from "../../../protocol-session/handwritten-annotation/handwritten-annotation.component";
import {Annotation} from "../../../annotation";
import {
  DisplayModificationParametersMetadataComponent
} from "../../../display-modification-parameters-metadata/display-modification-parameters-metadata.component";
import {AccountsService} from "../../../accounts/accounts.service";
import {StaffDataEntryPanelComponent} from "./staff-data-entry-panel/staff-data-entry-panel.component";
import {
  ProtocolBasicInfoEditorModalComponent
} from "../../../protocol-editor/protocol-basic-info-editor-modal/protocol-basic-info-editor-modal.component";
import {MetadataTableComponent} from "./metadata-table/metadata-table.component";
import {AreYouSureModalComponent} from "../../../are-you-sure-modal/are-you-sure-modal.component";

@Component({
    selector: 'app-job-submission',
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
    NgbDropdownItem,
    AnnotationTextFormComponent,
    HandwrittenAnnotationComponent,
    FormsModule,
    DisplayModificationParametersMetadataComponent,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNavOutlet,
    NgClass,
    QuillViewComponent,
    MetadataTableComponent
  ],
    templateUrl: './job-submission.component.html',
    styleUrl: './job-submission.component.scss'
})
export class JobSubmissionComponent implements OnInit, AfterViewInit {
  @ViewChild('metadataTable') metadataTable?: MetadataTableComponent;
  activeTab = 'user'
  isPanelOpen = false;
  staffModeAvailable = false;
  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }
  initialized = false
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
  userCanEdit = false

  @ViewChild('previewVideo') previewVideo?: ElementRef;
  @Input() set job(value: InstrumentJob|undefined) {
    this._job = value
    console.log(value)
    if (value && this.initialized) {
      if (value.status === 'submitted') {
        this.userCanEdit = false
      } else {
        this.userCanEdit = true
      }
      // @ts-ignore
      this.setupJob(value);
    }
  }

  private setupJob(value: InstrumentJob) {
    // @ts-ignore
    this.form.patchValue({job_name: value.job_name, staff: value.staff.map(s => s.id), status: value.status})
    this.staffModeAvailable = false
    this.staffDataForm.disable()
    if (value.staff) {
      if (value.staff.length > 0) {
        if (this.accountService.username) {
          const staff = value.staff.find((s) => s.username === this.accountService.username)
          if (staff) {
            this.staffModeAvailable = true
            this.staffDataForm.enable()
          }
        }
      }
    } else {
      if (value.service_lab_group) {
        this.web.checkUserInLabGroup(value.service_lab_group.id).subscribe((result) => {
          if (result.status === 200) {
            this.staffModeAvailable = true
            this.staffDataForm.enable()
          }
        }, (error) => {
          this.staffModeAvailable = false
          this.staffDataForm.disable()
        })
      }
    }
    this.formSampleExtraData.patchValue({
      sample_type: value.sample_type,
      sample_number: value.sample_number
    })
    if (value.service_lab_group) {
      // @ts-ignore
      if (this.labGroupForm.value.selected) {
        this.web.getLabGroup(this.labGroupForm.value.selected).subscribe((labGroup) => {
          console.log(labGroup)
          this.selectedGroup = labGroup
          if (labGroup.service_storage) {
            this.service_storage = labGroup.service_storage
          }
        })
      }
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
    this.staffDataForm.patchValue({
      injection_volume: value.injection_volume,
      injection_unit: value.injection_unit,
      search_engine: value.search_engine,
      search_engine_version: value.search_engine_version,
      search_details: value.search_details,
      location: value.location,
    })
    this.setMetadataFormArray('user_metadata', value.user_metadata);
    this.setMetadataFormArray('staff_metadata', value.staff_metadata);
    console.log(this.metadata)
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
    user_metadata: this.fb.array<FormGroup<{
      id: FormControl<number>;
      value: FormControl<string>;
      name: FormControl<string>;
      type: FormControl<string>;
      mandatory: FormControl<boolean>;
      modifiers: FormControl<{samples: string, value: string}[]>;
    }>>([]),
    staff_metadata: this.fb.array<FormGroup<{
      id: FormControl<number>;
      value: FormControl<string>;
      name: FormControl<string>;
      type: FormControl<string>;
      mandatory: FormControl<boolean>;
      modifiers: FormControl<{samples: string, value: string}[]>;
    }>>([])
  })

  reagentForm = this.fb.group({
    name: ['', ],
    id: [null],
    current_quantity: [0,],
    unit: ['ug',],
    use_previous: [true],
    reagent_name_search: ['']
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

  staffDataForm = this.fb.group({
    injection_volume: [0],
    injection_unit: ['uL'],
    search_engine: ['DIANN'],
    search_engine_version: [''],
    search_details: [''],
    location: [''],
  });

  labGroupQuery: LabGroupQuery | undefined
  defaultLabGroup: string = 'MS Facility'
  labGroupUserQuery: UserQuery | undefined

  labUserMemberPage = 0
  labUserMemberPageSize = 10
  service_storage: StorageObject|undefined|null

  constructor(private offCanvas: NgbOffcanvas, public annotationService: AnnotationService, private modal: NgbModal, private fb: FormBuilder, private web: WebService, private toast: ToastService, public metadataService: MetadataService, private accountService: AccountsService) {
    this.annotationService.refreshAnnotation.asObservable().subscribe((value) => {
      if (this.job) {
        this.web.getInstrumentJob(this.job.id).subscribe((job) => {
          this.job = job
        })
      }
    })
    this.annotationService.moveToAnnotationCreator.asObservable().subscribe((value) => {
      if (value) {
        const divComponent = document.getElementById('annotationCreator')
        if (divComponent) {
          divComponent.scrollIntoView({behavior: 'smooth'})
        }
      }
    })
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.annotationService.cameraDevices = devices.filter((device) => device.kind === 'videoinput');
      this.annotationService.audioDevices = devices.filter((device) => device.kind === 'audioinput');
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
          return this.web.getStoredReagents(
            undefined, 5, 0, value, this.service_storage.id, null, true).pipe(
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
    this.projectSearchLoading = false
  }

  onProtocolSelected(event: NgbTypeaheadSelectItemEvent): void {
    const protocol = event.item;
    this.selectedProtocol = protocol;
    this.protocolForm.patchValue({
      id: protocol.id,
      protocol_title: protocol.protocol_title,
      protocol_description: protocol.protocol_description
    });
    this.protocolSearchLoading = false
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
      this.projectSearchLoading = false
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
    //this.subscribeToFormArrayChanges(this.metadata.get('user_metadata') as FormArray);
    //this.subscribeToFormArrayChanges(this.metadata.get('staff_metadata') as FormArray);

  }

  ngAfterViewInit() {
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
    this.initialized = true
    if (this.job) {
      this.setupJob(this.job)
    }
  }

  setMetadataFormArray(arrayName: string, metadata: any[]): void {
    const formArray: FormArray<FormGroup<{
      id: FormControl<number>;
      value: FormControl<string>;
      name: FormControl<string>;
      type: FormControl<string>;
      mandatory: FormControl<boolean>;
      modifiers: FormControl<{samples: string, value: string}[]>;
    }>> = this.fb.array<FormGroup>([]);
    for (const m of metadata) {
      const group: FormGroup<{
        id: FormControl<number>;
        value: FormControl<string>;
        name: FormControl<string>;
        type: FormControl<string>;
        mandatory: FormControl<boolean>;
        modifiers: FormControl<{samples: string, value: string}[]>;
      }> = this.fb.group({
        id: new FormControl(m.id) ,
        value: new FormControl(m.value),
        name: new FormControl(m.name),
        type: new FormControl(m.type),
        mandatory: new FormControl(m.mandatory),
        modifiers: new FormControl(m.modifiers)
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
      if (!this.userCanEdit && !this.staffModeAvailable && this.job.status === 'submitted') {
        await this.toast.show('Job', 'You do not have permission to edit this job. Please use annotation if there is any additional files or information needed to be uploaded.');
        return
      }
      const payload: any = {}
      if (!this.protocolForm.value.id) {
        // @ts-ignore
        const protocol = await this.web.createProtocol(this.protocolForm.value.protocol_title, this.protocolForm.value.protocol_description).toPromise()
        if (protocol) {
          // @ts-ignore
          this.protocolForm.patchValue({id: protocol.id, protocol_title: protocol.protocol_title, protocol_description: protocol.protocol_description})
          this.selectedProtocol = protocol
          payload["protocol"] = protocol.id
        }
      } else {
        if (this.protocolForm.dirty) {
          payload["protocol"] = this.protocolForm.value.id
        }
      }
      console.log(this.reagentForm.value)
      if (this.labGroupForm.valid && this.labGroupForm.value.selected) {
        const selectedLabGroup = await this.web.getLabGroup(this.labGroupForm.value.selected).toPromise()
        if (!this.reagentForm.value.id) {
          if (this.reagentForm.value.reagent_name_search) {
            let name = ""
            if (typeof this.reagentForm.value.reagent_name_search === 'string') {
              name = this.reagentForm.value.reagent_name_search
            } else {
              // @ts-ignore
              name = this.reagentForm.value.reagent_name_search.reagent.name
            }
            if (this.labGroupForm.valid && this.labGroupForm.value.selected) {
              if (selectedLabGroup) {
                if (selectedLabGroup.service_storage) {
                  // @ts-ignore
                  const reagent = await this.web.createStoredReagent(selectedLabGroup.service_storage.id, name, this.reagentForm.value.unit, this.reagentForm.value.current_quantity, `Added from job with id ${this.job.id}`, null, false, false, this.projectForm.value.id, this.protocolForm.value.id).toPromise()
                  if (reagent) {
                    // @ts-ignore
                    this.reagentForm.patchValue({id: reagent.id, name: reagent.reagent.name, current_quantity: reagent.quantity, unit: reagent.reagent.unit})
                    payload["stored_reagent"] = reagent.id
                  }
                }
              }
            }
          }
        } else {
          if (this.reagentForm.value.use_previous) {
            if (this.reagentForm.controls.id.dirty) {
              payload["stored_reagent"] = this.reagentForm.value.id
            } else {
              if (!this.job.stored_reagent) {
                payload["stored_reagent"] = this.reagentForm.value.id
              } else {
                if (this.job.stored_reagent.id !== this.reagentForm.value.id) {
                  payload["stored_reagent"] = this.reagentForm.value.id
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
                  payload["stored_reagent"] = reagent.id
                }
              }
            }
          }
        }
      } else {
        await this.toast.show('Lab Group', 'Please select a lab group before update with reagent information');
      }

      if (this.form.controls.staff.dirty) {
        // @ts-ignore
        const staffIds = this.form.value.staff.map((s) => s)
        payload["staff"] = staffIds
      }
      // check if there is any changes in user metadata form array
      if (this.metadata.get('user_metadata')) {
        if ((this.metadata.get('user_metadata') as FormArray).dirty) {
          const userMetadata = (this.metadata.get('user_metadata') as FormArray).controls.map((c) => c.value)
          payload["user_metadata"] = userMetadata
        } else {
          // check if any form within the form array is dirty
          for (const control of (this.metadata.get('user_metadata') as FormArray).controls) {
            if (control.dirty) {
              const userMetadata = (this.metadata.get('user_metadata') as FormArray).controls.map((c) => c.value)
              payload["user_metadata"] = userMetadata
              break
            }
          }
        }
      }

      if (this.form.controls.job_name.dirty) {
        payload["job_name"] = this.form.value.job_name
      }
      if (this.projectForm.controls.id.dirty) {
        payload["project"] = this.projectForm.value.id
      }
      if (this.fundingForm.controls.cost_center.dirty) {
        payload["cost_center"] = this.fundingForm.value.cost_center
      }
      if (this.fundingForm.controls.funder.dirty) {
        payload["funder"] = this.fundingForm.value.funder
      }
      if (this.formSampleExtraData.controls.sample_type.dirty) {
        payload["sample_type"] = this.formSampleExtraData.value.sample_type
      }
      if (this.formSampleExtraData.controls.sample_number.dirty) {
        payload["sample_number"] = this.formSampleExtraData.value.sample_number
      }
      if (this.labGroupForm.controls.selected.dirty) {
        payload["service_lab_group"] = this.labGroupForm.value.selected
      }
      // check if payload is empty
      if (Object.keys(payload).length === 0) {
        await this.toast.show('Job', 'No changes detected in user data');
      } else {
        // @ts-ignore
        const response = await this.web.updateInstrumentJob(this.job.id, payload).toPromise()
        if (response) {
          await this.toast.show('Job', 'Job updated successfully');
          this.job = response
        }
      }
    }
    if (this.staffModeAvailable) {
      await this.updateStaffData()
    }
  }

  async updateStaffData() {
    if (this.job) {
      if (this.staffModeAvailable) {
        const payload: any = {
        }
        if (this.job) {
          if (this.staffDataForm) {
            if (this.staffDataForm.controls.injection_volume.dirty) {
              payload["injection_volume"] = this.staffDataForm.value.injection_volume
            }
            if (this.staffDataForm.controls.injection_unit.dirty) {
              payload["injection_unit"] = this.staffDataForm.value.injection_unit
            }
            if (this.staffDataForm.controls.search_engine.dirty) {
              payload["search_engine"] = this.staffDataForm.value.search_engine
            }
            if (this.staffDataForm.controls.search_details.dirty) {
              payload["search_details"] = this.staffDataForm.value.search_details
            }
            if (this.staffDataForm.controls.search_engine_version.dirty) {
              payload["search_engine_version"] = this.staffDataForm.value.search_engine_version
            }
            if (this.staffDataForm.controls.location.dirty) {
              payload["location"] = this.staffDataForm.value.location
            }
          }
          if (this.metadata.get('staff_metadata')) {
            if ((this.metadata.get('staff_metadata') as FormArray).dirty) {
              const staffMetadata = (this.metadata.get('staff_metadata') as FormArray).controls.map((c) => c.value)
              payload["staff_metadata"] = staffMetadata
            } else {
              // check if any form within the form array is dirty
              for (const control of (this.metadata.get('staff_metadata') as FormArray).controls) {
                if (control.dirty) {
                  const staffMetadata = (this.metadata.get('staff_metadata') as FormArray).controls.map((c) => c.value)
                  payload["staff_metadata"] = staffMetadata
                  break
                }
              }
            }
          }
          if (Object.keys(payload).length === 0) {
            await this.toast.show('Job', 'No changes detected in staff data');
          } else {
            // @ts-ignore
            const response = await this.web.instrumentJobUpdateStaffData(this.job.id, payload).toPromise()
            if (response) {
              await this.toast.show('Job', 'Staff data updated successfully');
              this.job = response
            }
          }
        }
      }
    }
  }

  addMetadata(metadata: {name: string, type: string}, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    ref.closed.subscribe((result: any[]) => {
      if (result) {
        console.log(result)
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
        formArray.markAsDirty()
        this.update().then()
      }
    })
  }

  removeMetadata(index: number, arrayName: 'user_metadata'|'staff_metadata') {
    const formArray = this.metadata.get(arrayName) as FormArray;
    formArray.removeAt(index);
    formArray.markAsDirty()
    this.update().then()
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
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  handleDeleteAnnotation(annotation_id: number) {
    this.annotationService.deleteAnnotation(annotation_id)
  }

  openStaffDataEntryPanel() {
    if (this.staffModeAvailable) {
      const ref = this.offCanvas.open(StaffDataEntryPanelComponent, { scroll: true, backdrop: false})
      ref.componentInstance.job = this.job
      ref.closed.subscribe((result) => {
        if (result) {
          if (this.job) {
            this.web.instrumentJobUpdateStatus(this.job.id, result.status).subscribe((response) => {
              this.job = response
              this.toast.show('Job', 'Job status updated successfully')
            })
          }
        }
      })
    }
  }

  addMetadataModifier(index: number, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    const metadata = (this.metadata.get(arrayName) as FormArray).controls[index].value
    ref.componentInstance.name = metadata.name
    ref.componentInstance.type = metadata.type
    ref.componentInstance.value = metadata.value
    ref.componentInstance.allowMultipleSpecSelection = false
    ref.componentInstance.modifier = true

    ref.result.then((result: any[]) => {
      if (result) {
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

  editMetadataModifier(index: number, modifierIndex: number, arrayName: 'user_metadata'|'staff_metadata') {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    const metadata = (this.metadata.get(arrayName) as FormArray).controls[index].value
    const modifier = metadata['modifiers'][modifierIndex]
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

  async submit() {
    if (this.job) {
      if (this.job.status === 'draft') {
        const ref = this.modal.open(AreYouSureModalComponent)
        ref.componentInstance.message = "Please check all details are correct before submission. Once the job has been submitted, the user will not be able to make any changes to the job besides annotations."
        ref.result.then((result) => {
          if (result) {
            console.log(result)
            this.update().then(
              () => {
                if (this.job){
                  this.web.instrumentJobSubmit(this.job.id).subscribe((response) => {
                    this.job = response
                  })
                }
              }
            )
          }
        })

      }
    }
  }
  currentField = ""
  individualFieldSearchValue = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }

        let name = this.currentField;
        if (!name) {
          return of([]);
        }
        name = name.toLowerCase();
        return this.web.instrumentJobIndividualFieldTypeAhead(name, value).pipe(
          map(results => {
            return results.results;
          }), catchError(() => {
            return of([]);
          })
        )
      })
    );
  }

  openProtocolBasicInfoEditor() {
    const ref = this.modal.open(ProtocolBasicInfoEditorModalComponent, {scrollable: true})
    ref.componentInstance.protocol = this.selectedProtocol

    ref.result.then((result) => {
      if (result) {
        this.selectedProtocol = result
        this.protocolForm.patchValue({
          id: result.id,
          protocol_title: result.protocol_title,
          protocol_description: result.protocol_description
        })
      }
    })
  }

  handleMetadataUpdated(event: {
    name:string,
    value: string,
    type: string,
    id: number,
    data_type: string,
    modifiers: {samples: string, value: string}[]
  }[]) {
    for (const metadata of event) {
      console.log(metadata)
      if (metadata.data_type === "user_metadata") {
        const formArray = this.metadata.get('user_metadata') as FormArray;
        this.updateMetadataFormArray(formArray, metadata);
      } else if (metadata.data_type === "staff_metadata") {
        const formArray = this.metadata.get('staff_metadata') as FormArray;
        this.updateMetadataFormArray(formArray, metadata);
      }
    }
    this.update().then()
  }

  private updateMetadataFormArray(formArray: FormArray<any>, metadata: {
    name: string;
    value: string;
    type: string;
    id: number;
    data_type: string;
    modifiers: { samples: string; value: string }[]
  }) {
    for (const f of formArray.controls) {
      if (f.value.id === metadata.id) {
        if (f.value.value !== metadata.value) {
          f.patchValue({
            value: metadata.value
          })
          formArray.markAsDirty()
        } else {
          if (!f.value.modifiers) {
            f.patchValue({
              modifiers: metadata.modifiers
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

  exportTableToTSV() {
    if (this.metadataTable) {
      this.metadataTable.exportTableToTSV()
    }
  }

}
