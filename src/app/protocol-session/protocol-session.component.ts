import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../data.service";
import {TimerService} from "../timer.service";
import {WebService} from "../web.service";
import {NgClass} from "@angular/common";
import {ProtocolStep} from "../protocol";
import {SpeechService} from "../speech.service";

@Component({
  selector: 'app-protocol-session',
  standalone: true,
  imports: [
    NgClass
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
  @Input() set protocolSessionId(value: string) {
    this._protocolSessionId = value;
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

  constructor(private speech: SpeechService , private dataService: DataService, public web: WebService, public timer: TimerService) {

  }



  ngOnInit() {
    if (this.protocolSessionId === '') {
      const protocolString = localStorage.getItem('protocol');
      if (protocolString) {
        this.dataService.protocol = JSON.parse(protocolString);
      }
    }
    if (this.dataService.protocol) {
      this.sections = []
      this.dataService.protocol.steps.forEach((step) => {
        const section = this.sections.filter((section) => section.title === step.step_section)
        if (section.length === 0) {
          this.sections.push({title: step.step_section, duration: step.step_section_duration, steps: [step], currentStep: step.step_id})
        } else {
          section[0].steps.push(step)
        }
        if (!this.timer.timeKeeper[step.step_id.toString()]) {
          this.timer.timeKeeper[step.step_id.toString()] = {duration: step.step_duration, current: step.step_duration, started: false, startTime: Date.now(), spent: 0}
        }
      })
    }
  }

  handleSectionClick(section: {title: string, duration: number, steps: ProtocolStep[], currentStep: number}) {
    this.currentSection = section;
    const step = section.steps.find((step) => step.step_id === section.currentStep);
    console.log(step)
    if (step) {
      this.currentStep = step;
    }
  }

  goToNext() {
    if (this.currentSection) {
      console.log(this.currentStep)
      const nextStep = this.currentSection.steps.find((step) => step.id === this.currentStep?.next_step[0]);
      if (nextStep) {
        this.currentStep = nextStep;
      }
    }
  }

  getNextStep() {
    if (this.currentSection) {
      const nextStep = this.currentSection.steps.find((step) => step.id === this.currentStep?.next_step[0]);
      if (nextStep) {
        return this.stripHtml(nextStep.step_description).slice(0, 30);
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
    this.timer.timeKeeper[step_id.toString()].startTime = Date.now();
    this.timer.timeKeeper[step_id.toString()].started = true;
  }

  pauseTimer(step_id: number) {
    this.timer.timeKeeper[step_id.toString()].started = false;
    this.timer.timeKeeper[step_id.toString()].duration = this.timer.timeKeeper[step_id.toString()].current;
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
}
