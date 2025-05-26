import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Validators, FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {InstrumentJob} from "../../../../instrument-job";
import {
  MetadataTemplateSelectionComponent
} from "../../../../metadata-template-selection/metadata-template-selection.component";
import {
  NgbAlert,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {MethodMetadataModalComponent} from "../method-metadata-modal/method-metadata-modal.component";
import {WebService} from "../../../../web.service";
import {StoredReagent} from "../../../../storage-object";
import {MetadataTableTemplate} from "../../../../metadata-column";
import {NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-sample-information',
  imports: [
    MetadataTemplateSelectionComponent,
    NgbAlert,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbTooltip,
    ReactiveFormsModule,
    NgbNav,
    NgbNavOutlet,
    NgbNavItem,
  ],
  templateUrl: './sample-information.component.html',
  styleUrl: './sample-information.component.scss'
})
export class SampleInformationComponent implements OnInit, OnDestroy {
  private _job: InstrumentJob|undefined = undefined

  @Input() set job(value: InstrumentJob|undefined) {
    this._job = value
    if (value) {
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
      this.formSampleExtraData.patchValue({
        sample_number: value.sample_number,
        sample_type: value.sample_type,
      })
      if (value.selected_template) {
        if (value.selected_template.field_mask_mapping) {
          for (const field of value.selected_template.field_mask_mapping) {
            this.selectedTemplateFieldMap[field.name] = field.mask
          }
        }
      }
    }
  }

  get job(): InstrumentJob|undefined {
    return this._job
  }
  @Output() jobChange: EventEmitter<InstrumentJob> = new EventEmitter<InstrumentJob>()
  @Output() hasChanges: EventEmitter<boolean> = new EventEmitter<boolean>()

  formSampleExtraDataSubscription?: Subscription;
  reagentFormSubscription?: Subscription;

  formSampleExtraData = this.fb.group({
    sample_type: ['',],
    sample_number: [0,],
  })

  reagentForm = this.fb.group({
    name: ['', ],
    id: [null],
    current_quantity: [0,],
    unit: ['ug',],
    use_previous: [true],
    reagent_name_search: ['']
  })

  selectedStoredReagent: StoredReagent|undefined = undefined
  selectedTemplateFieldMap: {[key: string]: string} = {}

  constructor(private fb: FormBuilder, private web: WebService) {
  }

  ngOnInit() {
    this.formSampleExtraDataSubscription = this.formSampleExtraData.valueChanges.subscribe(() => {
      this.emitUpdatedJob()
    })
    this.reagentFormSubscription = this.reagentForm.valueChanges.subscribe(() => {
      this.emitUpdatedJob()
    })
  }

  handleSelectedTemplate(template: MetadataTableTemplate) {
    if (this.job) {
      this.web.instrumentJobSelectedTemplate(this.job.id, template.id).subscribe((response: InstrumentJob) => {
        this.selectedTemplateFieldMap = {}
        if (this.job) {
          this.job = response
          this.selectedTemplateFieldMap = {}
          if (response.selected_template) {
            if (response.selected_template.field_mask_mapping) {
              for (const field of response.selected_template.field_mask_mapping) {
                this.selectedTemplateFieldMap[field.name] = field.mask
              }
            }
          }

          this.jobChange.emit(this.job)
        }
      })
    }
  }

  removeSelectedTemplate() {
    if (this.job) {
      this.web.instrumentJobRemoveSelectedTemplate(this.job.id).subscribe((response: any) => {
        this.job = response
      })
    }
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

  emitUpdatedJob() {
    if (this.job) {
      if (this.formSampleExtraData.value.sample_number !== this.job.sample_number && this.formSampleExtraData.value.sample_number) {
        this.job.sample_number = this.formSampleExtraData.value.sample_number
      }
      if (this.formSampleExtraData.value.sample_type !== this.job.sample_type && this.formSampleExtraData.value.sample_type) {
        this.job.sample_type = this.formSampleExtraData.value.sample_type
      }
      if (this.selectedStoredReagent) {
        this.job.stored_reagent = this.selectedStoredReagent
      }
      if (this.reagentForm.dirty || this.formSampleExtraData.dirty) {
        this.hasChanges.emit(true)
      }
      this.jobChange.emit(this.job)
    }
  }

  ngOnDestroy() {
    if (this.formSampleExtraDataSubscription) {
      this.formSampleExtraDataSubscription.unsubscribe()
    }
    if (this.reagentFormSubscription) {
      this.reagentFormSubscription.unsubscribe()
    }
  }
}
