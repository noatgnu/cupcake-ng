import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {AnnotationTextFormComponent} from "../annotation-text-form/annotation-text-form.component";
import {FormsModule} from "@angular/forms";
import {HandwrittenAnnotationComponent} from "../handwritten-annotation/handwritten-annotation.component";
import {AnnotationPresenterComponent} from "../annotation-presenter/annotation-presenter.component";
import {
  NgbDateStruct,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle, NgbModal,
  NgbModalConfig, NgbProgressbar, NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {ProtocolSection, ProtocolStep} from "../../protocol";
import {TimerService} from "../../timer.service";
import {DataService} from "../../data.service";
import {Annotation, AnnotationQuery} from "../../annotation";
import {WebsocketService} from "../../websocket.service";
import {ToastService} from "../../toast.service";
import {WebService} from "../../web.service";
import {TimeKeeper} from "../../time-keeper";
import {AddSimpleCounterModalComponent} from "../add-simple-counter-modal/add-simple-counter-modal.component";
import {AddChecklistModalComponent} from "../add-checklist-modal/add-checklist-modal.component";
import {AddTableModalComponent} from "../add-table-modal/add-table-modal.component";
import {AccountsService} from "../../accounts/accounts.service";
import {SpeechService} from "../../speech.service";
import {RandomAnnotationModalComponent} from "../random-annotation-modal/random-annotation-modal.component";
import {UploadLargeFileModalComponent} from "../../upload-large-file-modal/upload-large-file-modal.component";
import {InstrumentBookingModalComponent} from "../../instruments/instrument-booking-modal/instrument-booking-modal.component";
import {Instrument} from "../../instrument";
import {ReagentTableComponent} from "../reagent-table/reagent-table.component";
import {
  StepMetadataExporterModalComponent
} from "./step-metadata-exporter-modal/step-metadata-exporter-modal.component";
import {AnnotationInputComponent} from "../annotation-input/annotation-input.component";
import {McpSdrfSuggestionsComponent} from "../mcp-sdrf-suggestions/mcp-sdrf-suggestions.component";
import {MediaDeviceService} from "../../media-device.service";
import {SiteSettingsService} from "../../site-settings.service";

@Component({
    selector: 'app-step-view',
  imports: [
    AnnotationTextFormComponent,
    FormsModule,
    HandwrittenAnnotationComponent,
    AnnotationPresenterComponent,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbProgressbar,
    ReagentTableComponent,
    NgbTooltip,
    AnnotationInputComponent,
    McpSdrfSuggestionsComponent
  ],
    templateUrl: './step-view.component.html',
    styleUrl: './step-view.component.scss'
})
export class StepViewComponent {
  @Input() currentSection?: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}
  @Output() showSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();
  private _currentStep?: ProtocolStep
  @Input() set currentStep(value: ProtocolStep) {
    this._currentStep = value
    if (value) {
      if (this.dataService.currentSession) {
        this.web.getAnnotations(this.dataService.currentSession.unique_id, value.id).subscribe((data: AnnotationQuery) => {
          this.annotations = data;
        })
      }
    } else {
      this.annotations = undefined;
    }
  }
  @Input() sections: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}[] = []

  get currentStep(): ProtocolStep {
    return this._currentStep!
  }

  mouseOverElement: string = "";
  clickedElement: string = "";
  annotations?: AnnotationQuery;

  constructor(
    private modalConfig: NgbModalConfig,
    private modal: NgbModal,
    public timer: TimerService,
    public dataService: DataService,
    private ws: WebsocketService,
    private toastService: ToastService,
    private web: WebService,
    private accounts: AccountsService,
    private speech: SpeechService,
    public mediaDevice: MediaDeviceService,
    private siteSettings: SiteSettingsService
  ) {
    this.modalConfig.backdrop = 'static';
    this.modalConfig.keyboard = false;
    this.ws.annotationWSConnection?.subscribe((data: Annotation) => {
      if (data) {
        if (this.annotations) {
          this.toastService.show('Annotation', 'Annotation Updated')
          const annotation = this.annotations.results.findIndex((annotation) => annotation.id === data.id);
          if (annotation !== -1) {
            this.annotations.results[annotation] = data;
            this.annotations.results = [...this.annotations.results]
          }
        }
      }
    })
    this.dataService.updateAnnotationSummary.subscribe((data) => {
      if (data && this.annotations) {
        const annotation = this.annotations.results.findIndex((annotation) => annotation.id === data.annotationID);
        console.log(annotation)
        if (annotation) {
          this.web.getAnnotation(data.annotationID).subscribe((data: Annotation) => {
            console.log(data)
            if (this.annotations) {
              this.annotations.results[annotation] = data;
              this.annotations.results = [...this.annotations.results]
              this.toastService.show('Annotation', 'Annotation Summary Updated')
            }
          })
        }
      }
    })

  }

  showHideSidebar() {
    this.showSidebar.emit(true)
  }

  goToNext() {
    if (this.currentSection) {
      const nextStep = this.currentSection.steps.find((step) => step.id === this.currentStep?.next_step[0]);
      if (nextStep) {
        this.currentStep = nextStep;
        this.currentSection.currentStep = nextStep.id;
      } else {
        this.sections.find((section) => {
          const step = section.steps.find((step) => this.currentStep?.next_step.includes(step.id));
          if (step) {
            this.currentStep = step;
            this.currentSection = section;
            this.currentSection.currentStep = step.id;
            return true;
          } else {
            return false;
          }
        })
      }
    }
  }

  getNextStep() {
    if (this.currentSection) {
      const nextStep = this.currentSection.steps.find((step) => step.id === this.currentStep?.next_step[0]);
      if (nextStep) {
        return this.stripHtml(nextStep.step_description).slice(0, 30);
      } else {
        // @ts-ignore
        for (const step of this.dataService.protocol?.steps) {
          if (this.currentStep?.next_step.includes(step.id)) {
            return this.stripHtml(step.step_description).slice(0, 30);
          }
        }
      }
    }
    return '';
  }

  goToPrevious() {
    if (this.currentSection) {
      if (this.currentStep) {
        // @ts-ignore
        const previousStep = this.currentSection.steps.find((step) => step.next_step.includes(this.currentStep?.id));
        if (previousStep) {
          this.currentStep = previousStep;
          this.currentSection.currentStep = previousStep.id;
        } else {
          this.sections.find((section) => {
            // @ts-ignore
            const step = section.steps.find((step) => step.next_step.includes(this.currentStep?.id));
            if (step) {
              this.currentStep = step;
              this.currentSection = section;
              this.currentSection.currentStep = step.id;
              return true;
            } else {
              return false;
            }
          })
        }
      }
    }
  }

  getPreviousStep() {
    if (this.currentSection) {
      if (this.currentStep) {
        // @ts-ignore
        const previousStep = this.currentSection.steps.find((step) => step.next_step.includes(this.currentStep?.id));
        if (previousStep) {
          return this.stripHtml(previousStep.step_description).slice(0, 30);
        } else {
          // @ts-ignore
          for (const step of this.dataService.protocol?.steps) {
            if (step.next_step.includes(this.currentStep?.id)) {
              return this.stripHtml(step.step_description).slice(0, 30);
            }
          }
        }
      }
    }
    return '';
  }

  stripHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  startTimer(step_id: number) {
    if (this.accounts.loggedIn) {
      if (!this.timer.remoteTimeKeeper[step_id.toString()]) {
        console.log(step_id)
        // @ts-ignore
        this.web.postStepTimeKeeper(this.dataService.currentSession?.unique_id, step_id, true, new Date(), this.currentStep?.step_duration).subscribe((data: TimeKeeper) => {
          this.timer.remoteTimeKeeper[step_id.toString()] = data;
          const utcDate = new Date(data.start_time).getTime();
          this.timer.timeKeeper[step_id.toString()].startTime = utcDate;
          this.timer.timeKeeper[step_id.toString()].started = true;
          if (this.timer.timeKeeper[step_id.toString()].started && !this.timer.currentTrackingStep.includes(step_id)) {
            this.timer.currentTrackingStep.push(step_id);
          }
        })
      } else {
        this.web.updateTimeKeeper(this.timer.remoteTimeKeeper[step_id.toString()].id, true, new Date()).subscribe((data: TimeKeeper) => {
          this.timer.remoteTimeKeeper[step_id.toString()] = data;
          const utcDate = new Date(data.start_time).getTime();
          this.timer.timeKeeper[step_id.toString()].startTime = utcDate;
          this.timer.timeKeeper[step_id.toString()].started = true;
          if (this.timer.timeKeeper[step_id.toString()].started && !this.timer.currentTrackingStep.includes(step_id)) {
            this.timer.currentTrackingStep.push(step_id);
          }
        })
      }

    } else {
      this.timer.timeKeeper[step_id.toString()].startTime = Date.now();
      this.timer.timeKeeper[step_id.toString()].started = true;
    }

  }

  pauseTimer(step_id: number) {
    this.timer.timeKeeper[step_id.toString()].started = false;
    this.timer.timeKeeper[step_id.toString()].previousStop = this.timer.timeKeeper[step_id.toString()].current;
    if (this.accounts.loggedIn) {
      this.web.updateTimeKeeper(this.timer.remoteTimeKeeper[step_id.toString()].id, false, null, this.timer.timeKeeper[step_id.toString()].current).subscribe((data: TimeKeeper) => {
        this.timer.remoteTimeKeeper[step_id.toString()] = data;
      })
    }
  }

  resetTimer(step_id: number) {
    if (this.currentStep) {
      this.timer.timeKeeper[step_id.toString()].current = this.currentStep?.step_duration;
      this.timer.timeKeeper[step_id.toString()].duration = this.currentStep?.step_duration;
    }

    this.timer.timeKeeper[step_id.toString()].started = false;
  }

  saveRecording() {
    if (this.dataService.currentSession && this.currentStep && this.mediaDevice.recordedBlob) {
      this.web.saveMediaRecorderBlob(
        this.dataService.currentSession.unique_id,
        this.currentStep.id,
        this.mediaDevice.recordedBlob,
        this.clickedElement.toLowerCase()
      ).subscribe((data: any) => {
        this.toastService.show('Annotation', 'Recording Saved Successfully')
        this.refreshAnnotations();
        this.mediaDevice.deletePreviewRecording(); // Clear the recording after saving
      })
    }
  }

  annotationMenuClick(item: string) {
    if (item === 'Counter') {
      if (this.dataService.currentSession && this.currentStep) {
        const ref = this.modal.open(AddSimpleCounterModalComponent)
        ref.closed.subscribe((data: any) => {
          if (data) {
            const payload: any = {
              total: data.total,
              current: 0,
              name: data.name,
            }

            // @ts-ignore
            this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, this.currentStep.id, payload, 'counter').subscribe((data: any) => {
              this.toastService.show('Annotation', 'Counter Saved Successfully')
              this.refreshAnnotations();
            })
          }
        })
      }

    } else if (item === 'Checklist') {
      if (this.dataService.currentSession && this.currentStep) {
        const ref = this.modal.open(AddChecklistModalComponent)
        ref.closed.subscribe((data: any) => {
          if (data) {
            const payload: any = {
              checkList: [],
              name: data.name
            }
            for (const line of data.checkList.split('\n')) {
              payload.checkList.push({checked: false, content: line.replace('\r', '')})
            }
            // @ts-ignore
            this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, this.currentStep.id, payload, 'checklist').subscribe((data: any) => {
              this.toastService.show('Annotation', 'Checklist Saved Successfully')
              this.refreshAnnotations();
            })
          }
        })
      }
    } else if (item === 'Table') {
      if (this.dataService.currentSession && this.currentStep) {
        const ref = this.modal.open(AddTableModalComponent)
        ref.closed.subscribe((data: any) => {
          if (data) {
            const payload: any = {
              nRow: data.nRow,
              nCol: data.nCol,
              name: data.name,
              content: []
            }
            for (let i = 0; i < data.nRow; i++) {
              const modelRow: string[] = []
              for (let j = 0; j < data.nCol; j++) {
                modelRow.push("")
              }
              payload.content.push(modelRow)
            }
            // @ts-ignore
            this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, this.currentStep.id, payload, 'table').subscribe((data: any) => {
              this.toastService.show('Annotation', 'Table Saved Successfully')
              this.refreshAnnotations();
            })
          }
        })

      }
    } else if (item === 'Calculator') {
      // @ts-ignore
      this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, this.currentStep.id, {}, 'calculator').subscribe((data: any) => {
        this.toastService.show('Annotation', 'Calculator Saved Successfully');
        this.refreshAnnotations();
      })
    } else if (item === 'Molarity Calculator'){
      // @ts-ignore
      this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, this.currentStep.id, {}, 'mcalculator').subscribe((data: any) => {
        this.toastService.show('Annotation', 'Calculator Saved Successfully');
        this.refreshAnnotations();
      })
    } else if (item === 'Randomization'){
      const ref = this.modal.open(RandomAnnotationModalComponent, {scrollable: true})
      ref.closed.subscribe((data: any) => {
        this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, this.currentStep.id, data, 'randomization').subscribe((data: any) => {
          this.toastService.show('Randomization', 'Randomization Saved Successfully')
          this.refreshAnnotations();
        })
      })

    }else if (item === "Large/Multiple Files"){
      const ref = this.modal.open(UploadLargeFileModalComponent)
      ref.componentInstance.session_id = this.dataService.currentSession?.unique_id;
      ref.componentInstance.step_id = this.currentStep?.id;
      ref.componentInstance.folder_id = 0;
      ref.dismissed.subscribe((data: any) => {
        this.refreshAnnotations()
      })

    } else if (item === "Instrument") {
      const ref = this.modal.open(InstrumentBookingModalComponent, {scrollable: true})
      ref.closed.subscribe((data: {instrument: Instrument, selectedRange: {started: Date |undefined, ended: Date | undefined}, usageDescription: string, maintenance: boolean, repeat: number, repeatUntil: NgbDateStruct|undefined}) => {
        this.web.createInstrumentUsageAnnotation(this.dataService.currentSession?.unique_id, data.instrument.id, data.selectedRange.started, data.selectedRange.ended, this._currentStep?.id, data.usageDescription, undefined, null, null, data.maintenance, data.repeat, data.repeatUntil).subscribe((data: any) => {
          this.toastService.show('Annotation', 'Instrument Booking Saved Successfully')
          this.refreshAnnotations();
        })
      })
    } else {
      if (this.clickedElement === item) {
        this.clickedElement = "";
        return;
      }
      this.clickedElement = item;
    }

  }

  handleTextAnnotation(text: string) {
    if (this.dataService.currentSession && this.currentStep) {
      this.web.saveAnnotationText(this.dataService.currentSession.unique_id, this.currentStep.id, text).subscribe((data: any) => {
        this.toastService.show('Annotation', 'Text Saved Successfully')
        // @ts-ignore
        this.web.getAnnotations(this.dataService.currentSession.unique_id, this.currentStep.id).subscribe((data: AnnotationQuery) => {
          this.annotations = data;
        })
      })
    }
  }

  handleSketchAnnotation(sketch: any) {
    // @ts-ignore
    this.web.saveSketch(this.dataService.currentSession.unique_id, this.currentStep.id, sketch).subscribe((data: any) => {
      this.toastService.show('Annotation', 'Sketch Saved Successfully')
      // @ts-ignore
      this.web.getAnnotations(this.dataService.currentSession.unique_id, this.currentStep.id).subscribe((data: AnnotationQuery) => {
        this.annotations = data;
      })
    })
  }

  handleFileInput(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (this.dataService.currentSession && this.currentStep) {
        this.web.saveAnnotationFile(this.dataService.currentSession.unique_id, this.currentStep.id, file, this.clickedElement.toLowerCase()).subscribe((data: any) => {
          this.refreshAnnotations();
        })
      }
    }
  }

  refreshAnnotations() {
    // @ts-ignore
    this.web.getAnnotations(this.dataService.currentSession.unique_id, this.currentStep.id).subscribe((data: AnnotationQuery) => {
      this.annotations = data;
      this.toastService.show('Annotation', 'Annotation List Updated Successfully')
    })
  }

  deleteAnnotation(annotation_id: number) {
    // @ts-ignore
    this.web.deleteAnnotation(annotation_id).subscribe((data: any) => {
      this.toastService.show('Annotation', 'Annotation Deleted Successfully')
      this.refreshAnnotations();
    })
  }

  previousAnnotationPage() {
    if (this.annotations?.previous) {
      // @ts-ignore
      this.web.getAnnotationsURL(this.annotations.previous.replace("http://", "https://")).subscribe((data: AnnotationQuery) => {
        this.annotations = data;
      })
    }
  }
  nextAnnotationPage() {
    if (this.annotations?.next) {
      // @ts-ignore
      this.web.getAnnotationsURL(this.annotations.next.replace("http://", "https://")).subscribe((data: AnnotationQuery) => {
        this.annotations = data;
      })
    }
  }

  summarySectionPrompt() {
    let prompt = 'The following are the steps of experiment that were completed:\n';
    if (this.currentSection) {
      for (let i = 0; i < this.currentSection.steps.length; i++) {
        const step = this.currentSection.steps[i];
        prompt += `${i+1}. ${this.stripHtml(step.step_description)}\n`
      }
    }
    prompt += 'Please provide a summary to what have been completed in 1 paragraph.\nllm-Answer:\n'
    this.web.postSummaryRequest(prompt, {section: this.currentSection?.data.id}).subscribe((data: any) => {})
  }

  getStepSummarySoFar(step: ProtocolStep) {
    /*let prompt = 'The following are the steps of experiment section that were completed:\n';
    let positionInSection = 0;
    if (this.currentSection) {
      for (let i = 0; i < this.currentSection.steps.length; i++) {
        const step = this.currentSection.steps[i];
        if (step.id === this.currentStep?.id) {
          positionInSection = i;
          break;
        }

        prompt += `${i+1}. ${this.stripHtml(step.step_description)}\n`
      }
    }
    if (positionInSection === 0) {
      this.dataService.stepCompletionSummary[step.id] = {started: false, completed: true, content: "No prior steps.", promptStarted: false}
    } else {
      prompt += `Knowing that the current step is ${step.step_description}.Please provide a summary without adding any further information to what have been completed in 1 paragraph within 3 sentences or less.\nllm-Answer:\n`
      this.web.postSummaryRequest(prompt, {section: this.currentSection?.data.id, step: step.id}).subscribe((data: any) => {
        this.dataService.stepCompletionSummary[step.id] = {started: true, completed: false, content: "", promptStarted: false}
      })
    }*/
    const step_ids:number[] = [];
    if (this.currentSection) {
      for (let i = 0; i < this.currentSection.steps.length; i++) {
        const step = this.currentSection.steps[i];
        if (step.id === this.currentStep?.id) {
          break;
        }

        step_ids.push(step.id)
      }
    }
    // @ts-ignore
    this.web.postSummarizeStep(step_ids, {section: this.currentSection?.data.id, step: step.id}, this.currentStep?.id).subscribe((data: any) => {
      this.dataService.stepCompletionSummary[step.id] = {started: true, completed: false, content: "", promptStarted: false}
    })
  }

  getStepDescription(step: ProtocolStep) {
    const reagents = step.reagents
    let description = step.step_description.slice()
    for (const reagent of reagents) {
      description = description.replaceAll(`%${reagent.id}.name%`, reagent.reagent.name)
      description = description.replaceAll(`%${reagent.id}.quantity%`, reagent.quantity.toString())
      description = description.replaceAll(`%${reagent.id}.unit%`, reagent.reagent.unit)
      description = description.replaceAll(`%${reagent.id}.scaled_quantity%`, (reagent.quantity * reagent.scalable_factor).toFixed(2))
    }
    return description

  }

  cauldronConnect(step: ProtocolStep) {
    const a = document.createElement('a');
    const stepPosition = this.currentSection?.steps.findIndex((s) => s.id === step.id);
    const payload: any = {
      step: step.id,
      token: this.accounts.token,
      folder: 0,
      baseURL: this.web.baseURL,
      name: "",
      session: this.dataService.currentSession?.unique_id,
    }
    if (stepPosition !== undefined && stepPosition !== -1) {
      payload.name = `${stepPosition+1}/${this.currentSection?.steps.length}`;
    }
    a.href = "cauldron:" + btoa(JSON.stringify(payload));
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  exportMetadata() {
    if (this.dataService.currentSession) {
      const ref = this.modal.open(StepMetadataExporterModalComponent, {scrollable: true})
      this.web.stepExportMetadata(this.currentStep.id, this.dataService.currentSession.unique_id).subscribe((data) => {
        ref.componentInstance.data = data
        ref.componentInstance.step = this.currentStep
        ref.componentInstance.session = this.dataService.currentSession
        ref.componentInstance.protocol = this.dataService.protocol

        this.toastService.show('Export', 'Metadata Exported Successfully')
      })
    }
  }

  onMcpAnnotationCreated(annotation: any) {
    this.toastService.show('MCP SDRF', 'Annotation created from SDRF suggestion');
    this.refreshAnnotations();
  }

  onMcpMetadataCreated(metadata: any) {
    if (metadata.type === 'modification_parameters') {
      // Handle modification parameters specifically
      this.toastService.show('MCP SDRF', `${metadata.data.length} modification parameter column(s) configured`);
      console.log('Modification metadata created:', metadata);
      
      // You could integrate with existing metadata creation APIs here
      // For example, create actual metadata columns via the metadata service
      
    } else {
      this.toastService.show('MCP SDRF', 'Metadata columns created from SDRF suggestion');
    }
  }

  // Check if AI SDRF suggestions module is enabled
  isAiSdrfSuggestionsEnabled(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return settings?.enable_ai_sdrf_suggestions !== false;
  }

  openSdrfModal() {
    const ref = this.modal.open(McpSdrfSuggestionsComponent, {
      size: 'lg',
      centered: true
    });
    ref.componentInstance.step = this.currentStep;
    ref.componentInstance.sessionId = this.dataService.currentSession?.unique_id;
    
    ref.componentInstance.annotationCreated.subscribe((annotation: any) => {
      this.onMcpAnnotationCreated(annotation);
    });
    
    ref.componentInstance.metadataCreated.subscribe((metadata: any) => {
      this.onMcpMetadataCreated(metadata);
    });
  }

}
