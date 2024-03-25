import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../data.service";
import {TimerService} from "../timer.service";
import {WebService} from "../web.service";
import {NgClass} from "@angular/common";
import {Protocol, ProtocolStep} from "../protocol";
import {SpeechService} from "../speech.service";
import {AnnotationTextFormComponent} from "./annotation-text-form/annotation-text-form.component";
import {HandwrittenAnnotationComponent} from "./handwritten-annotation/handwritten-annotation.component";
import {ProtocolSession} from "../protocol-session";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SessionSelectionModalComponent} from "./session-selection-modal/session-selection-modal.component";
import {AccountsService} from "../accounts.service";
import {TimeKeeper} from "../time-keeper";

@Component({
  selector: 'app-protocol-session',
  standalone: true,
  imports: [
    NgClass,
    AnnotationTextFormComponent,
    HandwrittenAnnotationComponent
  ],
  templateUrl: './protocol-session.component.html',
  styleUrl: './protocol-session.component.scss'
})
export class ProtocolSessionComponent implements OnInit{

  showSection: boolean = true;
  private _protocolSessionId: string = '';
  sections: {title: string, duration: number, steps: ProtocolStep[], currentStep: number}[] = []
  viewAnnotationMenu: boolean = false;
  mouseOverElement: string = "";
  clickedElement: string = "";
  sessionID: string = '';



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
  currentSection: {title: string, duration: number, steps: ProtocolStep[], currentStep: number}|null = null;
  currentStep: ProtocolStep|null = null;
  speechRecognition: any;
  recording: boolean = false;
  recordingChunks: any[] = [];
  recordedBlob?: Blob;
  mediaRecorder?: MediaRecorder
  audioURL?: string;

  constructor(private accounts: AccountsService, private speech: SpeechService , public dataService: DataService, public web: WebService, public timer: TimerService, private modal: NgbModal) {

  }



  ngOnInit() {
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
      this.sections = []
      this.dataService.protocol.steps.forEach((step) => {
        const section = this.sections.filter((section) => section.title === step.step_section)
        if (section.length === 0) {
          this.sections.push({title: step.step_section, duration: step.step_section_duration, steps: [step], currentStep: step.id})
        } else {
          section[0].steps.push(step)
        }
        if (!this.timer.timeKeeper[step.id.toString()]) {
          this.timer.timeKeeper[step.id.toString()] = {duration: step.step_duration, current: step.step_duration, started: false, startTime: Date.now(), spent: 0}
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

  handleSectionClick(section: {title: string, duration: number, steps: ProtocolStep[], currentStep: number}) {
    this.currentSection = section;
    const step = section.steps.find((step) => step.id === section.currentStep);
    if (step) {
      this.currentStep = step;
    }
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
    this.timer.timeKeeper[step_id.toString()].duration = this.timer.timeKeeper[step_id.toString()].current;
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

  startRecording() {
    //this.speechRecognition.start();
    console.log('start recording')
    console.log(navigator.mediaDevices)

    this.recording = true;
    this.recordingChunks = [];
    navigator.mediaDevices.getUserMedia({audio: true}).then(
      (stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.onstart = () => {
          console.log('recording started')
        }
        this.mediaRecorder.ondataavailable = (event) => {
          console.log(event);
          this.recordingChunks.push(event.data);
        }
        this.mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          console.log('recording stopped')
          this.recordedBlob = new Blob(this.recordingChunks, {type: 'audio/webm'});
          this.audioURL = window.URL.createObjectURL(this.recordedBlob);
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

  }

  annotationMenuClick(item: string) {
    if (this.clickedElement === item) {
      this.clickedElement = "";
      return;
    }
    this.clickedElement = item;
  }

  handleTextAnnotation(text: string) {
    console.log(text)
  }

  handleSketchAnnotation(sketch: any) {
    console.log(sketch)
  }
}
