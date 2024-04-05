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
import {Annotation, AnnotationQuery} from "../annotation";
import {AnnotationPresenterComponent} from "./annotation-presenter/annotation-presenter.component";
import {ToastService} from "../toast.service";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {WebsocketService} from "../websocket.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AddSimpleCounterModalComponent} from "./add-simple-counter-modal/add-simple-counter-modal.component";
import {AddChecklistModalComponent} from "./add-checklist-modal/add-checklist-modal.component";

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
    NgbDropdownItem
  ],
  templateUrl: './protocol-session.component.html',
  styleUrl: './protocol-session.component.scss'
})
export class ProtocolSessionComponent implements OnInit{
  @ViewChild('previewVideo') previewVideo?: ElementRef;
  showSection: boolean = true;
  private _protocolSessionId: string = '';
  sections: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}[] = []
  viewAnnotationMenu: boolean = false;
  mouseOverElement: string = "";
  clickedElement: string = "";
  private _sessionID: string = '';
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
    }
    this._sessionID = value;
  }

  get sessionID(): string {
    return this._sessionID;
  }

  cameraDevices: MediaDeviceInfo[] = [];
  currentCameraDevice: MediaDeviceInfo|null = null;
  audioDevices: MediaDeviceInfo[] = [];
  currentAudioDevice: MediaDeviceInfo|null = null;


  @Input() set protocolSessionId(value: string) {
    const data = value.split("&")
    if (data.length > 1) {
      this.sessionID = data[1];
    }
    this._protocolSessionId = data[0];
  }

  get protocolSessionId(): string {
    return this._protocolSessionId;
  }
  currentSection: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}|null = null;
  _currentStep: ProtocolStep|null = null;
  set currentStep(value: ProtocolStep|null) {
    this._currentStep = value;
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

  get currentStep(): ProtocolStep|null {
    return this._currentStep;
  }

  speechRecognition: any;
  recording: boolean = false;
  recordingChunks: any[] = [];
  recordedBlob?: Blob;
  mediaRecorder?: MediaRecorder
  audioURL?: string;
  annotations?: AnnotationQuery;

  constructor(private ws: WebsocketService, private modalConfig: NgbModalConfig, private toastService: ToastService, private accounts: AccountsService, private speech: SpeechService , public dataService: DataService, public web: WebService, public timer: TimerService, private modal: NgbModal) {
    this.modalConfig.backdrop = 'static';
    this.modalConfig.keyboard = false;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.cameraDevices = devices.filter((device) => device.kind === 'videoinput');
      this.audioDevices = devices.filter((device) => device.kind === 'audioinput');
    })

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

  startRecording(audio: boolean, video: boolean) {
    //this.speechRecognition.start();
    console.log('start recording')
    this.recording = true;
    this.recordingChunks = [];
    let constraints: MediaStreamConstraints = { audio: audio, video: video };
    if (video) {
      // check agent if mobile or desktop
      if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
        constraints.video = { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: {exact: 'environment'}};
      } else {
        constraints.video = { width: { ideal: 1920 }, height: { ideal: 1080 }};
      }
      //constraints.video = { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: {exact: 'environment'}};
      if (this.currentCameraDevice) {
        console.log(this.currentCameraDevice)
        constraints.video = { deviceId: {exact: this.currentCameraDevice.deviceId}, width: { ideal: 1920 }, height: { ideal: 1080 }};
      }
    }
    if (this.currentAudioDevice) {
      console.log(this.currentAudioDevice)
      constraints.audio = { deviceId: {exact: this.currentAudioDevice.deviceId} }
    }
    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        if (this.previewVideo) {
          this.previewVideo.nativeElement.srcObject = stream;
          this.previewVideo.nativeElement.play();
        }
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.onstart = () => {
          this.toastService.show('Recording', 'Recording Started')
          console.log('recording started')
        }
        this.mediaRecorder.ondataavailable = (event) => {
          console.log(event);
          this.recordingChunks.push(event.data);
        }
        this.mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          console.log('recording stopped')
          this.toastService.show('Recording', 'Recording Stopped')
          this.recordedBlob = new Blob(this.recordingChunks, {type: 'audio/webm'});
          this.audioURL = window.URL.createObjectURL(this.recordedBlob);
          if (this.previewVideo) {
            this.previewVideo.nativeElement.stop()
          }
        }
        this.mediaRecorder.start();
        console.log(this.mediaRecorder)
      }
    )

  }

  stopRecording() {
    console.log(this.mediaRecorder)
    this.mediaRecorder?.stop();
    this.recording = false;
  }

  recordingHandler(event: any) {
    if ("results" in event) {
      const result = event.results[0][0].transcript;
      console.log(result)
    }
  }

  startSpeechRecognition() {
    this.speechRecognition = this.speech.createSpeechRecognition()
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.onresult = (event:any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      console.log(transcript)
    }
    this.speechRecognition.onend = (event:any) => {
      console.log(event)
      this.speechRecognition.stop()
    }
    this.speechRecognition.onstart = (event:any) => {
      console.log(event)
    }
    this.speechRecognition.start();
  }

  deletePreviewRecording() {
    this.recordedBlob = undefined;
    this.audioURL = undefined;
  }

  saveRecording() {
    if (this.dataService.currentSession && this.currentStep && this.recordedBlob) {
      this.web.saveMediaRecorderBlob(this.dataService.currentSession.unique_id, this.currentStep.id, this.recordedBlob, this.clickedElement.toLowerCase()).subscribe((data: any) => {
        this.toastService.show('Annotation', 'Recording Saved Successfully')
        this.refreshAnnotations();
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
      this.web.getAnnotationsURL(this.annotations.previous).subscribe((data: AnnotationQuery) => {
        this.annotations = data;
      })
    }
  }
  nextAnnotationPage() {
    if (this.annotations?.next) {
      // @ts-ignore
      this.web.getAnnotationsURL(this.annotations.next).subscribe((data: AnnotationQuery) => {
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

}
