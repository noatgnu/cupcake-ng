import { Component, Input, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {HandwrittenAnnotationComponent} from "../handwritten-annotation/handwritten-annotation.component";
import {AnnotationTextFormComponent} from "../annotation-text-form/annotation-text-form.component";
import {Annotation, AnnotationQuery} from "../../annotation";
import {AnnotationPresenterComponent} from "../annotation-presenter/annotation-presenter.component";
import {DataService} from "../../data.service";
import {NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem} from "@ng-bootstrap/ng-bootstrap";
import {MediaDeviceService} from "../../media-device.service";

@Component({
  selector: 'app-annotation-input',
  imports: [
    FormsModule,
    HandwrittenAnnotationComponent,
    AnnotationTextFormComponent,
    AnnotationPresenterComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
  ],
  templateUrl: './annotation-input.component.html',
  styleUrl: './annotation-input.component.scss'
})
export class AnnotationInputComponent {
  @Input() clickedElement: string = '';
  @Input() annotations: any = null;

  @ViewChild('previewVideo') previewVideo!: ElementRef;
  @ViewChild('enableVideo') enableVideo!: ElementRef;
  @ViewChild('enableAudio') enableAudio!: ElementRef;

  @Output() textAnnotation = new EventEmitter<string>();
  @Output() sketchAnnotation = new EventEmitter<any>();
  @Output() fileInput = new EventEmitter<any>();
  @Output() deleteAnnotation = new EventEmitter<any>();
  @Output() nextAnnotationPage = new EventEmitter<void>();
  @Output() previousAnnotationPage = new EventEmitter<void>();
  @Output() annotationTypeSelected = new EventEmitter<string>();
  @Output() saveRecording = new EventEmitter<void>();

  constructor(public mediaDevice: MediaDeviceService, public dataService: DataService) {}

  ngOnInit(): void {
    this.mediaDevice.enumerateDevices();
  }

  handleTextAnnotation(text: string): void {
    this.textAnnotation.emit(text);
  }

  handleSketchAnnotation(sketch: any): void {
    this.sketchAnnotation.emit(sketch);
  }

  handleFileInput(event: any): void {
    this.fileInput.emit(event);
  }

  startRecording(audio: boolean, video: boolean): void {
    this.mediaDevice.startRecording(audio, video, this.previewVideo);
  }

  stopRecording(): void {
    this.mediaDevice.stopRecording();
  }

  startScreenRecording(audio: boolean): void {
    this.mediaDevice.startScreenRecording(audio);
  }

  onDeleteRecording(): void {
    this.mediaDevice.deletePreviewRecording();
  }

  onSaveRecording(): void {
    this.saveRecording.emit();
  }

  onSelectAnnotationType(type: string): void {
    this.annotationTypeSelected.emit(type);
  }
}
