import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../data.service";
import {TimerService} from "../timer.service";
import {WebService} from "../web.service";
import {DatePipe, NgClass, NgOptimizedImage} from "@angular/common";
import {Protocol, ProtocolSection, ProtocolStep} from "../protocol";
import {SpeechService} from "../speech.service";
import {AnnotationTextFormComponent} from "./annotation-text-form/annotation-text-form.component";
import {HandwrittenAnnotationComponent} from "./handwritten-annotation/handwritten-annotation.component";
import {ProtocolSession} from "../protocol-session";
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbModalConfig
} from "@ng-bootstrap/ng-bootstrap";
import {SessionSelectionModalComponent} from "./session-selection-modal/session-selection-modal.component";
import {AccountsService} from "../accounts/accounts.service";
import {TimeKeeper} from "../time-keeper";
import {Annotation, AnnotationFolder, AnnotationQuery} from "../annotation";
import {AnnotationPresenterComponent} from "./annotation-presenter/annotation-presenter.component";
import {ToastService} from "../toast.service";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {WebsocketService} from "../websocket.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AddSimpleCounterModalComponent} from "./add-simple-counter-modal/add-simple-counter-modal.component";
import {AddChecklistModalComponent} from "./add-checklist-modal/add-checklist-modal.component";
import {WebrtcService} from "../webrtc.service";
import {AddTableModalComponent} from "./add-table-modal/add-table-modal.component";
import {AlignmentAnnotationComponent} from "./alignment-annotation/alignment-annotation.component";
import {CalculatorAnnotationComponent} from "./calculator-annotation/calculator-annotation.component";
import {SectionListComponent} from "./section-list/section-list.component";
import {FolderListComponent} from "./folder-list/folder-list.component";
import {StepViewComponent} from "./step-view/step-view.component";
import {FolderViewComponent} from "./folder-view/folder-view.component";

@Component({
  selector: 'app-protocol-session',
  standalone: true,
  imports: [
    NgClass,
    AnnotationTextFormComponent,
    HandwrittenAnnotationComponent,
    DatePipe,
    NgOptimizedImage,
    AnnotationPresenterComponent,
    ReactiveFormsModule,
    FormsModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    AlignmentAnnotationComponent,
    CalculatorAnnotationComponent,
    SectionListComponent,
    FolderListComponent,
    StepViewComponent,
    FolderViewComponent
  ],
  templateUrl: './protocol-session.component.html',
  styleUrl: './protocol-session.component.scss'
})
export class ProtocolSessionComponent implements OnInit{

  showSection: boolean = true;
  private _protocolSessionId: string = '';
  sections: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}[] = []
  viewAnnotationMenu: boolean = false;
  currentFolder?: AnnotationFolder;

  private _sessionID: string = '';
  viewMode: "section" | "folder" = "section"
  set sessionID(value: string) {
    if (this._sessionID !== value) {
      if (this.ws.timerWSConnection) {
        this.ws.closeTimerWS();
      }
      this.ws.connectTimerWS(value);
      this.ws.timerWSConnection?.subscribe((data: TimeKeeper) => {
        if (data.step){
          const getRemoteTimeKeeper = this.timer.remoteTimeKeeper[data.step.toString()];
          if (getRemoteTimeKeeper) {
            this.timer.remoteTimeKeeper[data.step.toString()] = data;
            if (data.started) {
              const utcDate = new Date(data.start_time).getTime();
              this.timer.timeKeeper[data.step.toString()].startTime = utcDate;
              this.timer.timeKeeper[data.step.toString()].started = true;
              if (this.timer.timeKeeper[data.step.toString()].started && !this.timer.currentTrackingStep.includes(data.step)) {
                this.timer.currentTrackingStep.push(data.step);
              }
            } else {
              this.timer.timeKeeper[data.step.toString()].started = false;
              this.timer.timeKeeper[data.step.toString()].previousStop = data.current_duration;
            }
          }
        }
      })
      if (this.ws.annotationWSConnection) {
        this.ws.closeAnnotationWS();
      }
      this.ws.connectAnnotationWS(value);

    }
    this._sessionID = value;
  }

  get sessionID(): string {
    return this._sessionID;
  }



  @Input() set protocolSessionId(value: string) {
    const data = value.split("&")
    if (data.length > 1) {
      this.sessionID = data[1];
      this.webrtc.connect(data[1])
    }
    this._protocolSessionId = data[0];
  }

  get protocolSessionId(): string {
    return this._protocolSessionId;
  }
  currentSection?: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number};
  _currentStep?: ProtocolStep;
  set currentStep(value: ProtocolStep) {
    this._currentStep = value;
  }

  get currentStep(): ProtocolStep {
    return this._currentStep!;
  }



  constructor(private webrtc: WebrtcService, private ws: WebsocketService, private modalConfig: NgbModalConfig, private toastService: ToastService, private accounts: AccountsService, private speech: SpeechService , public dataService: DataService, public web: WebService, public timer: TimerService, private modal: NgbModal) {
    this.modalConfig.backdrop = 'static';
    this.modalConfig.keyboard = false;
  }



  ngOnInit() {
    this.toastService.show('Protocol Session', 'Loading Protocol Session')
    if (this.protocolSessionId === '') {
      const protocolString = localStorage.getItem('protocol');
      if (protocolString) {
        this.dataService.protocol = JSON.parse(protocolString);
        this.parseProtocol()
      }
    } else {
      this.web.getProtocol(this.protocolSessionId).subscribe((data: any) => {
        this.dataService.protocol = data;
        this.parseProtocol();
        localStorage.setItem('protocol', JSON.stringify(data));
      })
    }

  }

  parseProtocol() {
    if (this.dataService.protocol) {
      console.log(this.dataService.protocol)
      const title = new DOMParser().parseFromString(this.dataService.protocol.protocol_title, 'text/html').textContent
      if (title) {
        this.dataService.protocol.protocol_title = title;
      }
      this.sections = this.dataService.protocol.sections.map((section) => {
        return {data: section, steps: [], currentStep: 0}
      })
      console.log(this.sections)

      this.dataService.protocol.steps.forEach((step) => {
        const section = this.sections.filter((section) => section.data.id === step.step_section)
        if (section.length > 0) {
          section[0].steps.push(step)
        }
        if (!this.timer.timeKeeper[step.id.toString()]) {
          this.timer.timeKeeper[step.id.toString()] = {duration: step.step_duration, current: step.step_duration, started: false, startTime: Date.now(), spent: 0, previousStop: step.step_duration}
        }
        if (!this.dataService.stepCompletionSummary[step.id]) {
          this.dataService.stepCompletionSummary[step.id] = {started: false, completed: false, content: "", promptStarted: false}
        }
      })
      this.web.getAssociatedSessions(this.dataService.protocol.id).subscribe((data: ProtocolSession[]) => {
        if (this.sessionID !== "") {
          this.web.getProtocolSession(this.sessionID).subscribe((session: ProtocolSession) => {
            if (session) {
              this.sessionID = session.unique_id;
              this.dataService.currentSession = session;
              for (const timeKeeper of session.time_keeper) {
                this.timer.remoteTimeKeeper[timeKeeper.step.toString()] = timeKeeper;
                this.timer.timeKeeper[timeKeeper.step.toString()].startTime = new Date(timeKeeper.start_time).getTime();
                this.timer.timeKeeper[timeKeeper.step.toString()].started = timeKeeper.started;
                this.timer.timeKeeper[timeKeeper.step.toString()].current = timeKeeper.current_duration;
                this.timer.timeKeeper[timeKeeper.step.toString()].previousStop = timeKeeper.current_duration;
                console.log(this.timer.timeKeeper[timeKeeper.step.toString()])
                if (this.timer.timeKeeper[timeKeeper.step.toString()].started && !this.timer.currentTrackingStep.includes(timeKeeper.step)) {
                  this.timer.currentTrackingStep.push(timeKeeper.step);
                }
              }
            }

          })
        } else {
          const ref = this.modal.open(SessionSelectionModalComponent, {centered: true, backdrop: 'static', keyboard: false, windowClass: 'session-selection-modal'})
          ref.componentInstance.associatedSessions = data;
          if (this.dataService.protocol) {
            ref.componentInstance.protocolId = this.dataService.protocol.id;
          }
          ref.result.then((session: ProtocolSession) => {
            if (session) {
              this.sessionID = session.unique_id;
              this.dataService.currentSession = session;
              for (const timeKeeper of session.time_keeper) {
                this.timer.remoteTimeKeeper[timeKeeper.step.toString()] = timeKeeper;
                this.timer.timeKeeper[timeKeeper.step.toString()].startTime = new Date(timeKeeper.start_time).getTime();
                this.timer.timeKeeper[timeKeeper.step.toString()].started = timeKeeper.started;
                this.timer.timeKeeper[timeKeeper.step.toString()].current = timeKeeper.current_duration;
                this.timer.timeKeeper[timeKeeper.step.toString()].previousStop = timeKeeper.current_duration;
                console.log(this.timer.timeKeeper[timeKeeper.step.toString()])
                if (this.timer.timeKeeper[timeKeeper.step.toString()].started && !this.timer.currentTrackingStep.includes(timeKeeper.step)) {
                  this.timer.currentTrackingStep.push(timeKeeper.step);
                }
              }
            }
          })
        }
      })

    }
  }

  handleSectionClick(section: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}) {
    this.currentSection = section;
    const step = section.steps.find((step) => step.id === section.currentStep);

    if (step) {
      this.currentStep = step;
    } else {
      this.currentStep = section.steps[0];
      section.currentStep = section.steps[0].id;
    }
    //this.summarySectionPrompt()
  }

  handleFolderClick(folder: AnnotationFolder) {
    this.currentFolder = folder;
  }

  annotationMenuClick() {

  }

}
