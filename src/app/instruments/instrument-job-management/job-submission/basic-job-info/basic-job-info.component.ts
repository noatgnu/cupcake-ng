import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {DatePipe, NgClass} from "@angular/common";
import {NgbAlert, NgbTooltip, NgbTypeahead, NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {InstrumentJob} from "../../../../instrument-job";
import {Project} from "../../../../project";
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, Subscription, switchMap, tap} from "rxjs";
import {WebService} from "../../../../web.service";
import {LabGroup, LabGroupQuery} from "../../../../lab-group";
import {UserQuery} from "../../../../user";
import {DataService} from "../../../../data.service";
import {AccountsService} from "../../../../accounts/accounts.service";
import {StorageObject, StoredReagent} from "../../../../storage-object";

@Component({
  selector: 'app-basic-job-info',
  imports: [
    DatePipe,
    NgbTooltip,
    NgbTypeahead,
    ReactiveFormsModule,
    NgClass,
    NgbAlert
  ],
  templateUrl: './basic-job-info.component.html',
  styleUrl: './basic-job-info.component.scss'
})
export class BasicJobInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  currentField: string = '';
  storedReagentSearchLoading = false;
  updatingFormFromInput = false;
  private _job: InstrumentJob|null|undefined = null;
  service_storage?: StorageObject
  initialized = false
  @Input() set job(job: InstrumentJob|undefined) {
    this._job = job;
    if (!job) {
      return;
    }
    this.updatingFormFromInput = true;
    if (this.initialized) {
      this.setupBasicInfo(job)
    }
    this.updatingFormFromInput = false;
  };
  get job(): InstrumentJob {
    return this._job!;
  }
  @Output() jobChange = new EventEmitter<InstrumentJob>();
  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() staffModeAvailable = new EventEmitter<boolean>();

  fundingForm = this.fb.group({
    cost_center: ['',],
    funder: ['',],
  })

  labGroupForm = this.fb.group({
    name: [''],
    selected: [null]
  })

  projectSearchLoading = false;
  selectedProject?: Project;
  private formSubscription?: Subscription;
  private projectFormSubscription?: Subscription;
  private labGroupFormSubscription?: Subscription;
  private fundingFormSubscription?: Subscription;


  form = this.fb.group({
    job_name: ['', Validators.required],
    staff: [[]],
    status: [''],
  })
  projectForm = this.fb.group({
    project_name: ['', Validators.required],
    project_description: ['', Validators.required],
    id: [null]
  })

  labGroupQuery: LabGroupQuery | undefined
  defaultLabGroup: string = this.dataService.serverSettings.default_service_lab_group
  private _labGroupUserQuery?: UserQuery;
  get labGroupUserQuery(): UserQuery | undefined {
    return this._labGroupUserQuery;
  }
  set labGroupUserQuery(value: UserQuery | undefined) {
    this._labGroupUserQuery = value;
    if (this._labGroupUserQuery && this._labGroupUserQuery.results) {
      this._labGroupUserQuery.results.forEach((user) => {
        if (user.id && user.username) {
          this.cachedLabMembers[user.id] = {
            id: user.id,
            username: user.username
          };
        }
      });
    }
  }
  labUserMemberPage = 0
  labUserMemberPageSize = 10
  selectedGroup?: LabGroup
  cachedLabMembers: {[id: number]: {id: number, username: string}} = {};



  constructor(private fb: FormBuilder, private web: WebService, private dataService: DataService, private accountService: AccountsService) {
  }

  ngAfterViewInit() {
    this.labGroupForm.controls.selected.valueChanges.subscribe((value) => {
      if (value) {
        this.web.getLabGroup(value).subscribe((labGroup) => {
          this.selectedGroup = labGroup
          if (this.service_storage) {
            // @ts-ignore
            this.service_storage = labGroup.service_storage
          }
        })
        this.web.getUsersByLabGroup(value, this.labUserMemberPageSize, this.labUserMemberPage).subscribe((users) => {
          this.labGroupUserQuery = users
        })
      }
    })
    this.labGroupForm.controls.name.valueChanges.subscribe((value) => {
      if (value) {
        this.web.getLabGroups(value, 10, 0, true).subscribe((labGroup) => {
          this.labGroupQuery = labGroup
        })
      }
    })
    this.labGroupForm.patchValue({name: this.defaultLabGroup}, {emitEvent: false})
    this.web.getLabGroups(this.defaultLabGroup, 10, 0, true).subscribe((labGroup) => {
      this.labGroupQuery = labGroup
      if (labGroup.results.length > 0) {
        if (!this.labGroupForm.value.selected) {
          // @ts-ignore
          this.labGroupForm.patchValue({selected: labGroup.results[0].id})
          this.labGroupForm.markAsDirty()
          // @ts-ignore
          this.service_storage = labGroup.results[0].service_storage
          this.selectedGroup = labGroup.results[0]
          this.hasChanges.emit(true)
          this.web.getUsersByLabGroup(labGroup.results[0].id).subscribe((users) => {
            this.labGroupUserQuery = users
          })
        }
      }
    })
    if (this.job) {
      this.setupBasicInfo(this.job)
    }
    this.updatingFormFromInput = false
    this.initialized = true

  }

  ngOnInit() {
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      if (!this.updatingFormFromInput) {
        this.emitUpdatedJob();
      }
    });

    this.projectFormSubscription = this.projectForm.valueChanges.subscribe(() => {
      if (!this.updatingFormFromInput && this.selectedProject) {
        this.emitUpdatedJob();
      }
    });
    this.labGroupFormSubscription = this.labGroupForm.valueChanges.subscribe(() => {
      if (!this.updatingFormFromInput) {
        this.emitUpdatedJob();
      }
    });

    this.fundingFormSubscription = this.fundingForm.valueChanges.subscribe(() => {
      if (!this.updatingFormFromInput) {
        this.emitUpdatedJob();
      }
    });
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

  async emitUpdatedJob() {
    if (!this._job) return;

    const updatedJob: InstrumentJob = {
      ...this._job,
      job_name: this.form.get('job_name')?.value || '',
      status: this.form.get('status')?.value || this._job.status,
      cost_center: this.fundingForm.get('cost_center')?.value || '',
      funder: this.fundingForm.get('funder')?.value || '',
    };

    if (this.selectedProject) {
      updatedJob.project = {
        id: this.selectedProject.id,
        project_name: this.selectedProject.project_name,
        project_description: this.selectedProject.project_description
      };
    }
    if (this.labGroupForm.value['selected'] && this.labGroupForm.value['name']) {
      updatedJob.service_lab_group = {
        id: this.labGroupForm.value['selected'],
        name: this.labGroupForm.value['name']
      };
    }
    if (this.form.value['staff']) {
      const staffMembers: any = this.form.value['staff'];
      updatedJob.staff = []
      for (const staffMemberId of staffMembers) {
        updatedJob.staff.push(this.cachedLabMembers[staffMemberId])
      }

    }

    this.jobChange.emit(updatedJob);

    const isDirty = this.form.dirty || this.projectForm.dirty || this.labGroupForm.dirty || this.fundingForm.dirty;
    this.hasChanges.emit(isDirty);
  }

  submitForm() {
    if (this.form.valid && this.projectForm.valid) {
      this.emitUpdatedJob();
    }
  }

  ngOnDestroy() {
    this.formSubscription?.unsubscribe();
    this.projectFormSubscription?.unsubscribe();
    this.labGroupFormSubscription?.unsubscribe();
    this.fundingFormSubscription?.unsubscribe();
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

  onUserMemberPageChange(page: number) {
    this.labUserMemberPage = page
    // @ts-ignore
    this.web.getUsersByLabGroup(this.labGroupForm.value.selected, this.labUserMemberPageSize, this.labUserMemberPage).subscribe((users) => {
      this.labGroupUserQuery = users
    })
  }

  setupBasicInfo(job: InstrumentJob) {
    this.form.patchValue(
      // @ts-ignore
      {job_name: job.job_name, staff: job.staff.map(s => s.id) || [], status: job.status},
      {emitEvent: false}
    );

    if (job.project) {
      this.web.getProject(job.project.id).subscribe((project) => {
        this.selectedProject = project;
        // @ts-ignore
        this.projectForm.patchValue({id: project.id,
          project_name: project.project_name,
          project_description: project.project_description
        }, {emitEvent: false});
        this.updatingFormFromInput = false;
      });

    }
    this.fundingForm.patchValue({
      cost_center: job.cost_center,
      funder: job.funder,
    }, {emitEvent: false});
    if (job.service_lab_group) {
      console.log('job.service_lab_group', job.service_lab_group)
      //this.labGroupForm.controls.name.setValue(value.service_lab_group.name)
      // @ts-ignore
      this.labGroupForm.controls.selected.setValue(job.service_lab_group.id)
    }
    if (job.staff) {
      if (job.staff.length > 0) {
        job.staff.forEach(staffMember => {
          if (staffMember.id && staffMember.username) {
            this.cachedLabMembers[staffMember.id] = {
              id: staffMember.id,
              username: staffMember.username
            };
          }
        });
        if (this.accountService.username) {
          const staff = job.staff.find((s) => s.username === this.accountService.username)
          if (staff) {
            this.staffModeAvailable.emit(true)
          }
        }
      } else {
        if (job.service_lab_group) {
          this.web.checkUserInLabGroup(job.service_lab_group.id).subscribe((result) => {
            if (result.status === 200) {
              this.staffModeAvailable.emit(true)
            }
          }, (error) => {
            this.staffModeAvailable.emit(false)
          })
        }
      }
    } else {
      if (job.service_lab_group) {
        this.web.checkUserInLabGroup(job.service_lab_group.id).subscribe((result) => {
          if (result.status === 200) {
            this.staffModeAvailable.emit(true)
          }
        }, (error) => {
          this.staffModeAvailable.emit(false)
        })
      }
    }
    if (job.service_lab_group) {
      // @ts-ignore
      if (this.labGroupForm.value.selected) {
        this.web.getLabGroup(this.labGroupForm.value.selected).subscribe((labGroup) => {
          this.selectedGroup = labGroup
          if (labGroup.service_storage) {
            this.service_storage = labGroup.service_storage
          }
        })
      }
    }
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

}
