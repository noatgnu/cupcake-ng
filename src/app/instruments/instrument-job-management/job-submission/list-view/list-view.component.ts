import { Component, Input, Output, EventEmitter } from '@angular/core';
import {FormControl, FormGroup, FormBuilder, ReactiveFormsModule, FormArray, FormsModule} from '@angular/forms';
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap} from 'rxjs';
import {
  DisplayModificationParametersMetadataComponent
} from "../../../../display-modification-parameters-metadata/display-modification-parameters-metadata.component";
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbTooltip,
  NgbTypeahead
} from "@ng-bootstrap/ng-bootstrap";
import {InstrumentJob} from "../../../../instrument-job";
import {AreYouSureModalComponent} from "../../../../are-you-sure-modal/are-you-sure-modal.component";
import {
  ProtocolBasicInfoEditorModalComponent
} from "../../../../protocol-editor/protocol-basic-info-editor-modal/protocol-basic-info-editor-modal.component";
import {UploadLargeFileModalComponent} from "../../../../upload-large-file-modal/upload-large-file-modal.component";
import {AddFavouriteModalComponent} from "../../../../add-favourite-modal/add-favourite-modal.component";
import {MetadataService} from "../../../../metadata.service";
import {JobMetadataCreationModalComponent} from "../../job-metadata-creation-modal/job-metadata-creation-modal.component";
import {MetadataColumn} from "../../../../metadata-column";
import {JobSubmissionService} from "../job-submission.service";

@Component({
  selector: 'app-list-view',
  imports: [
    DisplayModificationParametersMetadataComponent,
    ReactiveFormsModule,
    NgbTypeahead,
    FormsModule,
    NgbTooltip,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle
  ],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss'
})
export class ListViewComponent {
  private _job: InstrumentJob|undefined = undefined;
  @Input() set job(value: InstrumentJob|undefined) {
    this._job = value;
  }
  get job(): InstrumentJob|undefined {
    return this._job;
  }

  @Input() staffModeAvailable = false;
  @Input() sampleNumber = 0;
  @Input() searchValue!: (text$: Observable<string>) => Observable<string[]>;
  @Input() selectedTemplateFieldMap: { [key: string]: string } = {};
  @Input() userCanEdit = false;
  @Output() currentFormSet = new EventEmitter<any>();
  @Output() metadataRemoved = new EventEmitter<{index: number, data_type: string}>();
  @Output() metadataEdited = new EventEmitter<{index: number, data_type: string}>();
  @Output() metadataModifierAdded = new EventEmitter<{index: number, data_type: string}>();
  @Output() metadataModifierRemoved = new EventEmitter<{index: number, indexM: number, data_type: string}>();
  @Output() metadataModifierEdited = new EventEmitter<{index: number, indexM: number, data_type: string}>();
  @Output() favouriteAdded = new EventEmitter<{name: string, type: string, value: string}>();


  constructor(private fb: FormBuilder, public metadataService: MetadataService, private modal: NgbModal, public jobSubmission: JobSubmissionService) {}

  setCurrentForm(form: any): void {
    this.currentFormSet.emit(form);
  }






}
