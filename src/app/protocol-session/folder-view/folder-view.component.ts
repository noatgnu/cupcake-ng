import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../data.service";
import {Annotation, AnnotationFolder, AnnotationQuery} from "../../annotation";
import {AddSimpleCounterModalComponent} from "../add-simple-counter-modal/add-simple-counter-modal.component";
import {AddChecklistModalComponent} from "../add-checklist-modal/add-checklist-modal.component";
import {AddTableModalComponent} from "../add-table-modal/add-table-modal.component";
import {ToastService} from "../../toast.service";
import {WebService} from "../../web.service";
import {AnnotationTextFormComponent} from "../annotation-text-form/annotation-text-form.component";
import {FormsModule} from "@angular/forms";
import {HandwrittenAnnotationComponent} from "../handwritten-annotation/handwritten-annotation.component";
import {AnnotationPresenterComponent} from "../annotation-presenter/annotation-presenter.component";
import {RandomAnnotationModalComponent} from "../random-annotation-modal/random-annotation-modal.component";
import {WebsocketService} from "../../websocket.service";
import {AccountsService} from "../../accounts/accounts.service";
import {UploadLargeFileModalComponent} from "../../upload-large-file-modal/upload-large-file-modal.component";

@Component({
    selector: 'app-folder-view',
    imports: [
        NgbDropdown,
        NgbDropdownItem,
        NgbDropdownMenu,
        NgbDropdownToggle,
        AnnotationTextFormComponent,
        FormsModule,
        HandwrittenAnnotationComponent,
        AnnotationPresenterComponent
    ],
    templateUrl: './folder-view.component.html',
    styleUrl: './folder-view.component.scss'
})
export class FolderViewComponent {
  @ViewChild('previewVideo') previewVideo?: ElementRef;
  clickedElement: string = ""
  screenRecording: boolean = false;
  annotations?: AnnotationQuery
  recording: boolean = false;
  recordingChunks: any[] = [];
  recordedBlob?: Blob;
  mediaRecorder?: MediaRecorder
  audioURL?: string;
  cameraDevices: MediaDeviceInfo[] = [];
  currentCameraDevice: MediaDeviceInfo|null = null;
  audioDevices: MediaDeviceInfo[] = [];
  currentAudioDevice: MediaDeviceInfo|null = null;

  private _currentFolder?: AnnotationFolder
  @Input() set currentFolder(value: AnnotationFolder) {
    this._currentFolder = value
    this.refreshAnnotations();
  }

  @Output() showSidebar: EventEmitter<boolean> = new EventEmitter<boolean>()

  get currentFolder(): AnnotationFolder {
    return this._currentFolder!
  }

  audioContext: AudioContext = new AudioContext();
  analyser: AnalyserNode = this.audioContext.createAnalyser();
  dataArray: Uint8Array = new Uint8Array(this.analyser.frequencyBinCount);
  animationFrame: any;

  constructor(private accounts: AccountsService, private ws: WebsocketService, public dataService: DataService, private modal: NgbModal, private web: WebService, private toastService: ToastService) {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.cameraDevices = devices.filter((device) => device.kind === 'videoinput');
      this.audioDevices = devices.filter((device) => device.kind === 'audioinput');
    })
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

  annotationMenuClick(item: string) {
    if (item === 'Counter') {
      if (this.dataService.currentSession) {
        const ref = this.modal.open(AddSimpleCounterModalComponent)
        ref.closed.subscribe((data: any) => {
          if (data) {
            const payload: any = {
              total: data.total,
              current: 0,
              name: data.name,
            }

            // @ts-ignore
            this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, 0, payload, 'counter').subscribe((data: any) => {
              this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
                this.toastService.show('Annotation', 'Counter Saved Successfully')
                this.refreshAnnotations();
              })
            })
          }
        })
      }

    } else if (item === 'Checklist') {
      if (this.dataService.currentSession) {
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
            this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, 0, payload, 'checklist').subscribe((data: any) => {
              this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
                this.toastService.show('Annotation', 'Checklist Saved Successfully')
                this.refreshAnnotations();
              })

            })
          }
        })
      }
    } else if (item === 'Table') {
      if (this.dataService.currentSession) {
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
            this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, 0, payload, 'table').subscribe((data: any) => {
              this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
                this.toastService.show('Annotation', 'Table Saved Successfully')
                this.refreshAnnotations();
              })
            })
          }
        })

      }
    } else if (item === 'Calculator') {
      // @ts-ignore
      this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, 0, {}, 'calculator').subscribe((data: any) => {
        this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
          this.toastService.show('Annotation', 'Calculator Saved Successfully');
          this.refreshAnnotations();
        })

      })
    } else if (item === 'Molarity Calculator'){
      // @ts-ignore
      this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, 0, {}, 'mcalculator').subscribe((data: any) => {
        this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe(
          (data: any) => {
            this.toastService.show('Annotation', 'Molarity Calculator Saved Successfully');
            this.refreshAnnotations();
          }
        )
      })
    } else if (item === 'Randomization'){
      const ref = this.modal.open(RandomAnnotationModalComponent, {scrollable: true})
      ref.closed.subscribe((data: any) => {
        this.web.saveAnnotationJSON(this.dataService.currentSession.unique_id, 0, data, 'randomization').subscribe((data: any) => {
          this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
            this.toastService.show('Annotation', 'Randomization Saved Successfully')
            this.refreshAnnotations();
          })
        })
      })
    } else if (item === "Large/Multiple Files"){
      const ref = this.modal.open(UploadLargeFileModalComponent)
      ref.componentInstance.session_id = this.dataService.currentSession?.unique_id;
      ref.componentInstance.step_id = 0;
      ref.componentInstance.folder_id = this.currentFolder.id;
      ref.dismissed.subscribe((data: any) => {
        this.refreshAnnotations()
      })

    }else {
      if (this.clickedElement === item) {
        this.clickedElement = "";
        return;
      }
      this.clickedElement = item;
    }

  }

  refreshAnnotations() {
    if (this._currentFolder) {
      this.web.getAnnotationInFolder(this._currentFolder.id).subscribe((data: AnnotationQuery) => {
        this.annotations = data;
      })
    }
  }

  showHideSidebar() {
    this.showSidebar.emit(true);
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
          this.previewVideo.nativeElement.oncanplaythrough = () => {
            // @ts-ignore
            this.previewVideo.nativeElement.muted = true;
          }
          this.previewVideo.nativeElement.play();

        }
        this.mediaRecorder = new MediaRecorder(stream);
        if (audio) {
          let source = this.audioContext.createMediaStreamSource(stream);
          source.connect(this.analyser);
        }
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

  saveRecording() {
    if (this.dataService.currentSession && this.recordedBlob) {
      this.web.saveMediaRecorderBlob(this.dataService.currentSession.unique_id, 0, this.recordedBlob, this.clickedElement.toLowerCase()).subscribe((data: any) => {
        this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
          this.toastService.show('Annotation', 'Recording Saved Successfully')
          this.refreshAnnotations();
        })

      })
    }
  }

  handleTextAnnotation(text: string) {
    if (this.dataService.currentSession) {
      this.web.saveAnnotationText(this.dataService.currentSession.unique_id, 0, text).subscribe((data: any) => {
        this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
          this.toastService.show('Annotation', 'Text Saved Successfully')
          this.refreshAnnotations();
        })
      })
    }
  }

  handleSketchAnnotation(sketch: any) {
    // @ts-ignore
    this.web.saveSketch(this.dataService.currentSession.unique_id, 0, sketch).subscribe((data: any) => {
      this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
        this.toastService.show('Annotation', 'Sketch Saved Successfully')
        this.refreshAnnotations();
      })
    })
  }

  handleFileInput(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (this.dataService.currentSession) {
        this.web.saveAnnotationFile(this.dataService.currentSession.unique_id, 0, file, this.clickedElement.toLowerCase()).subscribe((data: any) => {
          this.web.annotationMoveToFolder(data.id, this.currentFolder.id).subscribe((data: any) => {
            this.toastService.show('Annotation', 'File Saved Successfully')
            this.refreshAnnotations();
          })
        })
      }
    }
  }
  deleteAnnotation(annotation_id: number) {
    // @ts-ignore
    this.web.deleteAnnotation(annotation_id).subscribe((data: any) => {
      this.toastService.show('Annotation', 'Annotation Deleted Successfully')
      this.refreshAnnotations();
    })
  }

  cauldronConnect(folder: AnnotationFolder) {
    const a = document.createElement('a');
     const payload: any = {
      step: 0,
      token: this.accounts.token,
      folder: folder.id,
      baseURL: this.web.baseURL,
      name: folder.folder_name,
       session: this.dataService.currentSession?.unique_id
    }

    a.href = "cauldron:" + btoa(JSON.stringify(payload));
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

}
