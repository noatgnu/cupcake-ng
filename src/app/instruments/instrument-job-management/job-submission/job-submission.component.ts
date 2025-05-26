import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
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
  NgbAlert,
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
import {Observable, debounceTime, distinctUntilChanged, switchMap, map, catchError, of, tap, Subscription} from 'rxjs';
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
import {WebsocketService} from "../../../websocket.service";
import {environment} from "../../../../environments/environment";
import {UploadLargeFileModalComponent} from "../../../upload-large-file-modal/upload-large-file-modal.component";
import {MetadataColumn, MetadataTableTemplate} from "../../../metadata-column";
import {AddFavouriteModalComponent} from "../../../add-favourite-modal/add-favourite-modal.component";
import {
  MetadataTemplateSelectionComponent
} from "../../../metadata-template-selection/metadata-template-selection.component";
import {
  MethodMetadataModalComponent
} from "./method-metadata-modal/method-metadata-modal.component";
import {
  SdrfValidationResultsModalComponent
} from "./sdrf-validation-results-modal/sdrf-validation-results-modal.component";
import {DataService} from "../../../data.service";
import {BasicJobInfoComponent} from "./basic-job-info/basic-job-info.component";
import {SampleInformationComponent} from "./sample-information/sample-information.component";
import {ListViewComponent} from "./list-view/list-view.component";
import {JobSubmissionService} from "./job-submission.service";
import {JobAnnotationsComponent} from "./job-annotations/job-annotations.component";

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
    MetadataTableComponent,
    MetadataTemplateSelectionComponent,
    NgbAlert,
    BasicJobInfoComponent,
    SampleInformationComponent,
    ListViewComponent,
    JobAnnotationsComponent
  ],
    templateUrl: './job-submission.component.html',
    styleUrl: './job-submission.component.scss'
})
export class JobSubmissionComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('basicJobInfo') basicJobInfo?: BasicJobInfoComponent;
  @ViewChild('sampleInformation') sampleInformation?: SampleInformationComponent;
  @ViewChild('listView') listView?: ListViewComponent;
  showHidden: boolean = false;
  metadataViewModeID: 'table' | 'list' = 'table'
  @ViewChild('metadataTable') metadataTable?: MetadataTableComponent;
  currentField = ""
  activeTab: 'user'|'staff' = 'user'
  isPanelOpen = false;
  staffModeAvailable = false;
  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }


  initialized = false
  currentForm: FormGroup|undefined
  selectedProject: Project|undefined
  selectedProtocol: Protocol|undefined

  private _job: InstrumentJob|undefined
  protocolSearchLoading = false
  storedReagentSearchLoading = false
  searchMetadataLoading = false
  selectedGroup: LabGroup | undefined
  userCanEdit = false
  selectedTemplateFieldMap: { [key: string]: string } = {};

  basicInfoChanged = false
  sampleInformationChanged = false

  @ViewChild('previewVideo') previewVideo?: ElementRef;
  @Input() set job(value: InstrumentJob|undefined) {
    this._job = value
    console.log(value)

    if (value) {
      if (value.status === 'submitted') {
        this.userCanEdit = false
      } else {
        this.userCanEdit = true
      }
      this.jobSubmission.createFormArrays(value)
      this.setupJob(value);
    }
  }

  private setupJob(value: InstrumentJob) {
    this.staffModeAvailable = false
    this.staffDataForm.disable()
    this.protocolForm.disable()
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
    this.staffDataForm.patchValue({
      injection_volume: value.injection_volume,
      injection_unit: value.injection_unit,
      search_engine: value.search_engine,
      search_engine_version: value.search_engine_version,
      search_details: value.search_details,
      location: value.location,
    })

  }

  get job(): InstrumentJob|undefined {
    return this._job
  }

  protocolForm = this.fb.group({
    protocol_title: ['', Validators.required],
    protocol_description: ['', Validators.required],
    id: [null]
  })

  editorConfig = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],

        ['clean'],

        ['link', 'image', 'video']
      ]
    }
  }



  staffDataForm = this.fb.group({
    injection_volume: [0],
    injection_unit: ['uL'],
    search_engine: ['DIANN'],
    search_engine_version: [''],
    search_details: [''],
    location: [''],
  });

  service_storage: StorageObject|undefined|null

  instrumentJobWebsocketSubscription: Subscription | undefined

  ngOnDestroy() {
    if (this.instrumentJobWebsocketSubscription) {
      this.instrumentJobWebsocketSubscription.unsubscribe();
    }
  }

  filterTableColumnName: string = ''

  updateSubscription?: Subscription;

  constructor(private cd: ChangeDetectorRef, private dataService: DataService, private offCanvas: NgbOffcanvas, private ws: WebsocketService, public annotationService: AnnotationService, private modal: NgbModal, private fb: FormBuilder, private web: WebService, private toast: ToastService, public metadataService: MetadataService, public accountService: AccountsService, public jobSubmission: JobSubmissionService) {
    if (this.ws.instrumentJobWSConnection) {
      this.instrumentJobWebsocketSubscription = this.ws.instrumentJobWSConnection.subscribe((message: any) => {
        if ("signed_value" in message && "instance_id" in message) {
          if (message['instance_id'] === this.web.cupcakeInstanceID) {
            this.toast.show("Export File", "Downloading file...")
            const downloadURL = environment.baseURL + "/api/protocol/download_temp_file/?token=" + message["signed_value"]
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = message["signed_value"].split(":")[0]
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else if ("instance_id" in message && "status" in message && "message" in message) {
          if (message['instance_id'] === this.web.cupcakeInstanceID) {
            console.log(message)
            if (message['status'] === 'error') {
              if (message['message'] === 'Validation failed') {
                this.toast.show("SDRF Validation", "Validation failed. Please check the errors.")
                const errors: string[] = message['errors']
                const ref = this.modal.open(SdrfValidationResultsModalComponent, {scrollable: true})
                ref.componentInstance.errors = errors

              } else {
                this.toast.show("Export File", message['message'])
              }
            } else if (message['status'] === 'completed') {
              if (message['message'] === "Validation successful") {
                this.toast.show("SDRF Validation", "Validation successful.")
              } else {
                this.toast.show("Export File", message['message'])
                if (this.job) {
                  this.web.getInstrumentJob(this.job.id).subscribe((job) => {
                    this.job = job
                  })
                }
              }
            }
          }
        }
      })
      this.updateSubscription = this.jobSubmission.updateSubject.subscribe((subject) => {
        this.update().then()
      })
    }

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

        return this.web.searchProtocols(undefined, value).pipe(
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



  createDraftJob() {
    if (this.basicJobInfo) {
      if (this.basicJobInfo.projectForm.valid && this.basicJobInfo.form.valid) {
        if (this.basicJobInfo.selectedProject) {
          // @ts-ignore
          this.web.createInstrumentJob(this.basicJobInfo.form.value.job_name, this.basicJobInfo.selectedProject.id).subscribe((response) => {
            this.job = response
            this.web.getProject(response.project.id).subscribe((project) => {
              this.selectedProject = project
            })
          })
        } else {
          // @ts-ignore
          this.web.createProject(this.basicJobInfo.projectForm.value.project_name, this.basicJobInfo.projectForm.value.project_description).subscribe((response) => {
            // @ts-ignore
            this.basicJobInfo.selectedProject = response
            // @ts-ignore
            this.basicJobInfo.projectForm.patchValue({id: response.id,
              project_name: response.project_name,
              project_description: response.project_description
            })
            // @ts-ignore
            this.web.createInstrumentJob(this.basicJobInfo.form.value.job_name, response.id).subscribe((response) => {
              this.job = response
              this.web.getProject(response.project.id).subscribe((project) => {
                // @ts-ignore
                this.basicJobInfo.selectedProject = project
              })
            })
          })
        }
      }
    }

  }

  ngOnInit(): void {
    //this.subscribeToFormArrayChanges(this.metadata.get('user_metadata') as FormArray);
    //this.subscribeToFormArrayChanges(this.metadata.get('staff_metadata') as FormArray);

  }

  ngAfterViewInit() {

    if (this.job) {
      this.setupJob(this.job)
    }
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
        if (name === "ms2 analyzer type") {
          name = "mass analyzer type"
        }
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

  setCurrentForm(form: any) {
    this.currentForm = form;
  }

  async update() {

    if (this.job) {
      if (!this.userCanEdit && !this.staffModeAvailable && this.job.status === 'submitted') {
        await this.toast.show('Job', 'You do not have permission to edit this job. Please use annotation if there is any additional files or information needed to be uploaded.');
        return
      }
      const payload: any = {}


      if (this.basicJobInfo && this.sampleInformation) {
        if (this.basicJobInfo.labGroupForm.valid && this.basicJobInfo.labGroupForm.value.selected) {
          const selectedLabGroup = await this.web.getLabGroup(this.basicJobInfo.labGroupForm.value.selected).toPromise()
          if (!this.sampleInformation.reagentForm.value.id) {
            if (this.sampleInformation.reagentForm.value.reagent_name_search) {
              let name = ""
              if (typeof this.sampleInformation.reagentForm.value.reagent_name_search === 'string') {
                name = this.sampleInformation.reagentForm.value.reagent_name_search
              } else {
                // @ts-ignore
                name = this.sampleInformation.reagentForm.value.reagent_name_search.reagent.name
              }
              if (this.basicJobInfo.labGroupForm.valid && this.basicJobInfo.labGroupForm.value.selected) {
                if (selectedLabGroup) {
                  if (selectedLabGroup.service_storage) {
                    // @ts-ignore
                    const reagent = await this.web.createStoredReagent(selectedLabGroup.service_storage.id, name, this.sampleInformation.reagentForm.value.unit, this.sampleInformation.reagentForm.value.current_quantity, `Added from job with id ${this.job.id}`, null, false, false, this.projectForm.value.id, this.protocolForm.value.id).toPromise()
                    if (reagent) {
                      // @ts-ignore
                      this.sampleInformation.reagentForm.patchValue({id: reagent.id, name: reagent.reagent.name, current_quantity: reagent.quantity, unit: reagent.reagent.unit})
                      payload["stored_reagent"] = reagent.id
                    }
                  }
                }
              }
            }
          } else {
            if (this.sampleInformation.reagentForm.value.use_previous) {
              if (this.sampleInformation.reagentForm.controls.id.dirty) {
                payload["stored_reagent"] = this.sampleInformation.reagentForm.value.id
              } else {
                if (!this.job.stored_reagent) {
                  payload["stored_reagent"] = this.sampleInformation.reagentForm.value.id
                } else {
                  if (this.job.stored_reagent.id !== this.sampleInformation.reagentForm.value.id) {
                    payload["stored_reagent"] = this.sampleInformation.reagentForm.value.id
                  }
                }
              }
            } else {
              // @ts-ignore
              const selectedLabGroup = await this.web.getLabGroup(this.basicJobInfo.labGroupForm.value.selected).toPromise()
              if (selectedLabGroup) {
                if (selectedLabGroup.service_storage) {
                  // @ts-ignore
                  const reagent = await this.web.createStoredReagent(selectedLabGroup.service_storage.id, this.sampleInformation.reagentForm.value.name, this.sampleInformation.reagentForm.value.unit, this.sampleInformation.reagentForm.value.current_quantity, `Added from job with id${this.job.id}`, null, false, false, this.projectForm.value.id, this.protocolForm.value.id).toPromise()
                  if (reagent) {
                    // @ts-ignore
                    this.sampleInformation.reagentForm.patchValue({id: reagent.id, name: reagent.reagent.name, current_quantity: reagent.quantity, unit: reagent.reagent.unit})
                    payload["stored_reagent"] = reagent.id
                  }
                }
              }
            }
          }
        } else {
          await this.toast.show('Lab Group', 'Please select a lab group before update with reagent information');
        }
      }

      // check if there is any changes in user metadata form array
      if (this.jobSubmission.metadata.get('user_metadata')) {
        if ((this.jobSubmission.metadata.get('user_metadata') as FormArray).dirty) {
          const userMetadata = (this.jobSubmission.metadata.get('user_metadata') as FormArray).controls.map((c) => c.value)
          console.log(this.jobSubmission.metadata.get('user_metadata'))
          payload["user_metadata"] = userMetadata
        } else {
          // check if any form within the form array is dirty
          for (const control of (this.jobSubmission.metadata.get('user_metadata') as FormArray).controls) {
            if (control.dirty) {
              const userMetadata = (this.jobSubmission.metadata.get('user_metadata') as FormArray).controls.map((c) => c.value)
              payload["user_metadata"] = userMetadata
              break
            }
          }
        }
      }

      if (this.basicInfoChanged && this.basicJobInfo) {
        if (this.basicJobInfo.form.controls.staff.dirty) {
          // @ts-ignore
          const staffIds = this.basicJobInfo.form.value.staff.map((s) => s)
          payload["staff"] = staffIds
        }
        if (this.basicJobInfo.form.controls.job_name.dirty) {
          payload["job_name"] = this.job.job_name
        }
        if (this.basicJobInfo.projectForm.controls.id.dirty) {
          payload["project"] = this.job.project
        }
        if (this.basicJobInfo.fundingForm.controls.cost_center.dirty) {
          payload["cost_center"] = this.job.cost_center
        }
        if (this.basicJobInfo.fundingForm.controls.funder.dirty) {
          payload["funder"] = this.job.funder
        }
        if (this.job.service_lab_group) {
          if (this.basicJobInfo.labGroupForm.controls.selected.dirty || this.basicJobInfo.labGroupForm.controls.selected.value !== this.job.service_lab_group.id) {
            payload["service_lab_group"] = this.basicJobInfo.labGroupForm.value.selected
          }
        } else {
          console.log(this.basicJobInfo.labGroupForm.controls.selected)
          if (this.basicJobInfo.labGroupForm.controls.selected) {
            payload["service_lab_group"] = this.basicJobInfo.labGroupForm.value.selected
          } else {
            if (this.basicJobInfo.selectedGroup) {
              payload["service_lab_group"] = this.basicJobInfo.selectedGroup.id
            }
          }
        }
      }

      if (this.sampleInformation) {
        if (this.sampleInformation.formSampleExtraData.controls.sample_type.dirty) {
          payload["sample_type"] = this.sampleInformation.formSampleExtraData.value.sample_type
        }
        if (this.sampleInformation.formSampleExtraData.controls.sample_number.dirty) {
          payload["sample_number"] = this.sampleInformation.formSampleExtraData.value.sample_number
        }
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
          if (!this.protocolForm.value.id && this.protocolForm.value.protocol_title && this.protocolForm.value.protocol_description) {
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
          if (this.jobSubmission.metadata.get('staff_metadata')) {
            if ((this.jobSubmission.metadata.get('staff_metadata') as FormArray).dirty) {
              const staffMetadata = (this.jobSubmission.metadata.get('staff_metadata') as FormArray).controls.map((c) => c.value)
              payload["staff_metadata"] = staffMetadata
            } else {
              // check if any form within the form array is dirty
              for (const control of (this.jobSubmission.metadata.get('staff_metadata') as FormArray).controls) {
                if (control.dirty) {
                  const staffMetadata = (this.jobSubmission.metadata.get('staff_metadata') as FormArray).controls.map((c) => c.value)
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
  checkMetadataAdd() {

  }



  handleDeleteAnnotation(annotation_id: any) {
    this.annotationService.deleteAnnotation(annotation_id as number)
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





  exportTableToTSV(data_type: 'user_metadata'|'staff_metadata'|'all') {
    if (this.metadataTable && this.job) {
      this.web.instrumentJobExportMetadata(this.job.id, this.web.cupcakeInstanceID, data_type).subscribe((response) => {

      })
    }
  }

  importMetadata(data_type: 'user_metadata'|'staff_metadata'|'all') {
    if (this.job) {
      const ref = this.modal.open(UploadLargeFileModalComponent)
      ref.componentInstance.metadata_import = data_type
      ref.componentInstance.instrument_job_id = this.job.id
      if (this.staffModeAvailable) {
        ref.componentInstance.instrument_user_type = this.staffModeAvailable
      } else {
        ref.componentInstance.instrument_user_type = 'user_annotation'
      }
    }
  }

  handleFavouriteAdded(event: any) {
    this.metadataService.addMetadataToFavourite(event.name, event.type, event.value, event.display_name, event.mode, event.lab_group).subscribe((response) => {
      this.toast.show("Favourite", "Favourite option added")
    })
  }



  validateSDRFMetadata() {
    if (this.job) {
      this.web.validateSDRFMetadata(this.job.id, this.web.cupcakeInstanceID).subscribe((response) => {

      })
    }
  }

  exportExcelTemplate() {
    if (this.job) {
      let export_type: 'user_metadata'|'staff_metadata'|'all' = 'user_metadata'
      if (this.staffModeAvailable) {
        export_type = 'all'
      }
      this.web.exportExcelTemplate(this.job.id, this.web.cupcakeInstanceID, export_type).subscribe((response) => {

      })
    }
  }

  importExcelTemplate() {
    if (this.job) {
      const ref = this.modal.open(UploadLargeFileModalComponent)
      let metadata_import: 'user_metadata_excel'|'staff_metadata_excel'|'all_excel' = 'user_metadata_excel'
      if (this.staffModeAvailable) {
        metadata_import = 'all_excel'
      }
      ref.componentInstance.metadata_import = metadata_import
      console.log(metadata_import)
      ref.componentInstance.instrument_job_id = this.job.id
      if (this.staffModeAvailable) {
        ref.componentInstance.instrument_user_type = this.staffModeAvailable
      } else {
        ref.componentInstance.instrument_user_type = 'user_annotation'
      }
    }
  }



  importMetadataFromMethod() {
    if (this.selectedProtocol && this.job) {
      const ref = this.modal.open(MethodMetadataModalComponent, {scrollable: true})
      if (this.selectedProtocol.metadata_columns) {
        ref.componentInstance.metadata_columns = this.selectedProtocol.metadata_columns
      }
      ref.componentInstance.action = 'import'
      ref.result.then((response: MetadataColumn[]) => {
        if (response && this.selectedProtocol && this.job) {
          if (response.length > 0) {
            this.web.instrumentJobCopyMetadataFromProtocol(this.job.id, response.map((m) => m.id)).subscribe((response) => {
              this.job = response
            })
          }
        }

      })
    }
  }

  copyMetadataFromMethod() {
    if (this.selectedProtocol && this.job) {
      const ref = this.modal.open(MethodMetadataModalComponent, {scrollable: true})
      ref.componentInstance.action = 'copy'
      ref.componentInstance.metadata_columns = [...this.job.user_metadata, ...this.job.staff_metadata]
      ref.result.then((response: MetadataColumn[]) => {
        if (response && this.selectedProtocol) {
          if (response.length > 0) {
            this.web.copyMetadataToProtocol(this.selectedProtocol.id, response).subscribe((result) => {
              this.selectedProtocol = result
            })
          }

        }
      })
    }
  }

  deleteMetadata(metadata: MetadataColumn) {
    if (this.selectedProtocol && this.job) {
      if (this.staffModeAvailable) {
        this.web.deleteMetaDataColumn(metadata.id).subscribe((response) => {
          if (this.selectedProtocol) {
            this.web.getProtocol(this.selectedProtocol.id).subscribe((response) => {
              this.selectedProtocol = response
            })
          }
        })
      }
    }
  }

  exportFile(file_type: string) {
    if (this.job) {
      if (file_type === "injection") {
        let dataFileCol = this.job.user_metadata.find((m) => m.name === "Data file")
        if (!dataFileCol) {
          dataFileCol = this.job.staff_metadata.find((m) => m.name === "Data file")
        }
        let positionCol = this.job.user_metadata.find((m) => m.name === "Position")
        if (!positionCol) {
          positionCol = this.job.staff_metadata.find((m) => m.name === "Position")
        }
        if (dataFileCol && positionCol) {
          const result = this.metadataService.convertInjectionFile(dataFileCol, positionCol, this.job.injection_volume, this.job.sample_number)
          // download file
          const blob = new Blob([result], { type: 'text/plain' });
          // convert blob to file
          const file = new File([blob], 'injection_list.tsv', { type: 'text/plain' });
          let export_type: 'user_annotation'|'staff_annotation' = 'user_annotation'
          if (this.staffModeAvailable) {
            export_type = 'staff_annotation'
          }
          this.web.saveAnnotationFile(undefined, undefined, file, 'file', this.job.id, export_type, "Randomized Injection List").subscribe((data: any) => {
            this.toast.show('Annotation', 'File Saved Successfully')
            this.annotationService.refreshAnnotation.next(true);
          })
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
      }
    }
  }

  handleJobInfoChange(updatedJob: InstrumentJob) {
    if (this.job) {
      this.job.job_name = updatedJob.job_name
      this.job.project = updatedJob.project
      this.job.cost_center = updatedJob.cost_center
      this.job.funder = updatedJob.funder
      this.job.staff = updatedJob.staff
      this.job.project = updatedJob.project
    }


  }

  handleBasicInfoChanges(hasChanges: boolean) {
    this.basicInfoChanged = true
  }

  handleEnableStaffMode(available: boolean) {
    if (available) {
      this.staffModeAvailable = true
      this.staffDataForm.enable()
      this.protocolForm.enable()
    } else {
      this.staffModeAvailable = false
      this.staffDataForm.disable()
      this.protocolForm.disable()
    }
  }

  handleSampleInformationJobChange(event: InstrumentJob) {
    if (this.job) {
      this.job.sample_number = event.sample_number
      this.job.sample_type = event.sample_type
      this.job.stored_reagent = event.stored_reagent
      if (this.job.selected_template !== event.selected_template) {
        this.job = event
      }
      if (this.job.selected_template) {
        this.selectedTemplateFieldMap = {}
        if (this.job.selected_template.field_mask_mapping) {
          this.job.selected_template.field_mask_mapping.forEach((mapping) => {
            this.selectedTemplateFieldMap[mapping.name] = mapping.mask
          })
        }
      }
    }
  }
  handleSampleInformationChange(hasChanges: boolean) {
    this.sampleInformationChanged = true
  }

  handleChangeActiveTab(activeTab: 'user'|'staff') {
    this.activeTab = activeTab
  }


}
