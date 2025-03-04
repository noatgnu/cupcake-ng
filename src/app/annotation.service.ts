import {ElementRef, Injectable} from '@angular/core';
import {
  AddSimpleCounterModalComponent
} from "./protocol-session/add-simple-counter-modal/add-simple-counter-modal.component";
import {AddChecklistModalComponent} from "./protocol-session/add-checklist-modal/add-checklist-modal.component";
import {AddTableModalComponent} from "./protocol-session/add-table-modal/add-table-modal.component";
import {
  RandomAnnotationModalComponent
} from "./protocol-session/random-annotation-modal/random-annotation-modal.component";
import {UploadLargeFileModalComponent} from "./upload-large-file-modal/upload-large-file-modal.component";
import {WebService} from "./web.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastService} from "./toast.service";
import {Subject} from "rxjs";
import {AnnotationQuery} from "./annotation";
import {
  InstrumentBookingModalComponent
} from "./instruments/instrument-booking-modal/instrument-booking-modal.component";
import {Instrument} from "./instrument";

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  enableVideo: boolean = false;
  enableAudio: boolean = false;
  clickedInstrumentItem: string = "";
  refreshAnnotation: Subject<boolean> = new Subject<boolean>();
  recording: boolean = false;
  screenRecording: boolean = false;
  speechRecognition: any;
  recordingChunks: any[] = [];
  recordedBlob?: Blob;
  mediaRecorder?: MediaRecorder
  audioURL?: string;
  cameraDevices: MediaDeviceInfo[] = [];
  currentCameraDevice: MediaDeviceInfo|null = null;
  audioDevices: MediaDeviceInfo[] = [];
  currentAudioDevice: MediaDeviceInfo|null = null;
  audioContext: AudioContext = new AudioContext();
  analyser: AnalyserNode = this.audioContext.createAnalyser();
  dataArray: Uint8Array = new Uint8Array(this.analyser.frequencyBinCount);
  animationFrame: any
  moveToAnnotationCreator: Subject<boolean> = new Subject<boolean>();

  constructor(private web: WebService, private modal: NgbModal, private toastService: ToastService) {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.cameraDevices = devices.filter((device) => device.kind === 'videoinput');
      this.audioDevices = devices.filter((device) => device.kind === 'audioinput');
    })
  }

  annotationInstrumentMenuClick(item: string, instrument_user_type: "user_annotation"|"staff_annotation", instrument_job_id: number) {
    console.log(item, instrument_user_type, instrument_job_id)
    if (item === 'Counter') {
      const ref = this.modal.open(AddSimpleCounterModalComponent)
      ref.closed.subscribe((data: any) => {
        if (data) {
          const payload: any = {
            total: data.total,
            current: 0,
            name: data.name,
          }
          this.web.saveAnnotationJSON(null, 0, payload, 'counter', instrument_job_id, instrument_user_type).subscribe((data: any) => {
            this.refreshAnnotation.next(true);
          })
        }
      })

    } else if (item === 'Checklist') {
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

          this.web.saveAnnotationJSON(null, 0, payload, 'checklist', instrument_job_id, instrument_user_type).subscribe((data: any) => {
            this.refreshAnnotation.next(true);
          })
        }
      })
    } else if (item === 'Table') {
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
          this.web.saveAnnotationJSON(null, 0, payload, 'table', instrument_job_id, instrument_user_type).subscribe((data: any) => {
            this.refreshAnnotation.next(true);
          })
        }
      })
    } else if (item === 'Calculator') {
      this.web.saveAnnotationJSON(null, 0, {}, 'calculator', instrument_job_id, instrument_user_type).subscribe((data: any) => {
        this.refreshAnnotation.next(true);

      })
    } else if (item === 'Molarity Calculator'){
      this.web.saveAnnotationJSON(null, 0, {}, 'mcalculator', instrument_job_id, instrument_user_type).subscribe((data: any) => {

      })
    } else if (item === 'Randomization'){
      const ref = this.modal.open(RandomAnnotationModalComponent, {scrollable: true})
      ref.closed.subscribe((data: any) => {
        this.web.saveAnnotationJSON(null, 0, data, 'randomization', instrument_job_id, instrument_user_type).subscribe((data: any) => {
          this.refreshAnnotation.next(true);
        })
      })
    } else if (item === "Large/Multiple Files"){
      const ref = this.modal.open(UploadLargeFileModalComponent)
      ref.componentInstance.step_id = 0;
      ref.componentInstance.instrument_job_id = instrument_job_id;
      ref.componentInstance.instrument_user_type = instrument_user_type
      ref.dismissed.subscribe((data: any) => {
        this.refreshAnnotation.next(true);
      })

    } else if (item === "Instrument") {
      const ref = this.modal.open(InstrumentBookingModalComponent, {scrollable: true})
      ref.closed.subscribe((data: {instrument: Instrument, selectedRange: {started: Date |undefined, ended: Date | undefined}, usageDescription: string}) => {
        this.web.createInstrumentUsageAnnotation(null, data.instrument.id, data.selectedRange.started, data.selectedRange.ended, null, data.usageDescription, instrument_job_id, instrument_user_type).subscribe((data: any) => {
          this.toastService.show('Annotation', 'Instrument Booking Saved Successfully')
          this.refreshAnnotation.next(true);
        })
      })
    } else {
      if (this.clickedInstrumentItem === item) {
        this.clickedInstrumentItem = "";
        return;
      }
      this.clickedInstrumentItem = item;
      this.moveToAnnotationCreator.next(true);
    }

  }

  startScreenRecording(audio: boolean) {
    this.recording = true;
    this.recordingChunks = [];
    let constraints: any = { audio: audio, video: {cursor: "always"} };
    if (this.currentAudioDevice && audio) {
      constraints.audio = { deviceId: {exact: this.currentAudioDevice.deviceId} }
    }
    navigator.mediaDevices.getDisplayMedia(constraints).then((stream) => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.onstart = () => {
        this.toastService.show('Recording', 'Recording Started')
        console.log('recording started')
        this.recording = true;
        this.screenRecording = true;
      }
      this.mediaRecorder.ondataavailable = (event) => {
        console.log(event);
        this.recordingChunks.push(event.data);
      }
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        console.log('recording stopped')
        this.toastService.show('Recording', 'Recording Stopped')
        this.recordedBlob = new Blob(this.recordingChunks, {type: 'video/webm'});
        this.audioURL = window.URL.createObjectURL(this.recordedBlob);
        this.recording = false;
        this.screenRecording = false;
      }
      this.mediaRecorder.start();
    })
  }

  startRecording(audio: boolean, video: boolean) {
    //this.speechRecognition.start();
    this.recording = true;
    console.log('start recording')
    const previewVideo = document.getElementById('previewVideo') as HTMLVideoElement
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
        if (previewVideo) {
          previewVideo.srcObject = stream;
          previewVideo.oncanplaythrough = () => {
            // @ts-ignore
            previewVideo.nativeElement.muted = true;
          }
          previewVideo.play();

        }
        if (audio) {
          let source = this.audioContext.createMediaStreamSource(stream);
          source.connect(this.analyser);
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
          if (previewVideo) {
            // @ts-ignore
            previewVideo.stop()
          }
        }
        this.mediaRecorder.start();
        this.drawVisualizer();
        console.log(this.mediaRecorder)
      }
    )
  }

  drawVisualizer() {
    this.animationFrame = requestAnimationFrame(() => this.drawVisualizer());
    this.analyser.getByteFrequencyData(this.dataArray);
    let canvas = document.getElementById('visualizer') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let barWidth = (canvas.width / this.analyser.frequencyBinCount) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
        barHeight = this.dataArray[i];
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    }
  }

  stopRecording() {
    console.log(this.mediaRecorder)
    this.mediaRecorder?.stop();
    this.recording = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  deletePreviewRecording() {
    this.recordedBlob = undefined;
    this.audioURL = undefined;
  }

  saveRecording(instrument_job_id: number, instrument_user_type: "user_annotation"|"staff_annotation") {
    if (this.recordedBlob) {
      this.web.saveMediaRecorderBlob(undefined, undefined, this.recordedBlob, this.clickedInstrumentItem.toLowerCase(), instrument_job_id, instrument_user_type).subscribe((data: any) => {
        this.toastService.show('Annotation', 'Recording Saved Successfully')
        this.refreshAnnotation.next(true);
      })
    }
  }

  handleTextAnnotation(text: string,instrument_job_id: number, instrument_user_type: "user_annotation"|"staff_annotation") {
    this.web.saveAnnotationText(undefined, undefined, text, instrument_job_id, instrument_user_type).subscribe((data: any) => {
      this.toastService.show('Annotation', 'Text Saved Successfully')
      this.refreshAnnotation.next(true);
    })
  }

  handleSketchAnnotation(sketch: any, instrument_job_id: number, instrument_user_type: "user_annotation"|"staff_annotation") {

    this.web.saveSketch(undefined, undefined, sketch, instrument_job_id, instrument_user_type).subscribe((data: any) => {
      this.toastService.show('Annotation', 'Sketch Saved Successfully')
      this.refreshAnnotation.next(true);
    })
  }

  handleFileInput(event: any, instrument_job_id: number, instrument_user_type: "user_annotation"|"staff_annotation", annotation: string = "", annotation_type: string = "") {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (annotation_type) {
        this.web.saveAnnotationFile(undefined, undefined, file, annotation_type, instrument_job_id, instrument_user_type, annotation).subscribe((data: any) => {
          this.toastService.show('Annotation', 'File Saved Successfully')
          this.refreshAnnotation.next(true);
        })
      } else {
        this.web.saveAnnotationFile(undefined, undefined, file, this.clickedInstrumentItem.toLowerCase(), instrument_job_id, instrument_user_type).subscribe((data: any) => {
          this.toastService.show('Annotation', 'File Saved Successfully')
          this.refreshAnnotation.next(true);
        })
      }

    }
  }


  deleteAnnotation(annotation_id: number) {
    this.web.deleteAnnotation(annotation_id).subscribe((data: any) => {
      this.toastService.show('Annotation', 'Annotation Deleted Successfully')
      this.refreshAnnotation.next(true);
    })
  }
}
