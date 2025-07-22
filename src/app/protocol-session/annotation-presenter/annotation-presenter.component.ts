import {Component, EventEmitter, Input, Output, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import {Annotation, AnnotationQuery} from "../../annotation";
import {AsyncPipe, DatePipe, NgOptimizedImage, NgClass, TitleCasePipe} from "@angular/common";
import {SketchPresenterComponent} from "../sketch-presenter/sketch-presenter.component";
import {ImagePresenterComponent} from "../image-presenter/image-presenter.component";
import {MediaPresenterComponent} from "../media-presenter/media-presenter.component";
import {WebService} from "../../web.service";
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbModalConfig,
  NgbTooltip,
  NgbCollapse
} from "@ng-bootstrap/ng-bootstrap";
import {TranscribeModalComponent} from "../transcribe-modal/transcribe-modal.component";
import {ChecklistPresenterComponent} from "../checklist-presenter/checklist-presenter.component";
import {CounterPresenterComponent} from "../counter-presenter/counter-presenter.component";
import {TablePresenterComponent} from "../table-presenter/table-presenter.component";
import {TextAnnotationPresenterComponent} from "../text-annotation-presenter/text-annotation-presenter.component";
import {AlignmentAnnotationComponent} from "../alignment-annotation/alignment-annotation.component";
import {CalculatorAnnotationComponent} from "../calculator-annotation/calculator-annotation.component";
import {MolarityCalculatorComponent} from "../molarity-calculator/molarity-calculator.component";
import {AnnotationRenameModalComponent} from "./annotation-rename-modal/annotation-rename-modal.component";
import {RandomizationPresenterComponent} from "../randomization-presenter/randomization-presenter.component";
import {DataService} from "../../data.service";
import {SpeechService} from "../../speech.service";
import {
  InstrumentBookingPresenterComponent
} from "../instrument-booking-presenter/instrument-booking-presenter.component";
import {AnnotationMetadataModalComponent} from "./annotation-metadata-modal/annotation-metadata-modal.component";
import {Subscription} from 'rxjs';
import {ToastService} from '../../toast.service';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-annotation-presenter',
    imports: [
        DatePipe,
        SketchPresenterComponent,
        ImagePresenterComponent,
        MediaPresenterComponent,
        ChecklistPresenterComponent,
        CounterPresenterComponent,
        TablePresenterComponent,
        TextAnnotationPresenterComponent,
        AlignmentAnnotationComponent,
        CalculatorAnnotationComponent,
        MolarityCalculatorComponent,
        RandomizationPresenterComponent,
        InstrumentBookingPresenterComponent,
        NgbTooltip,
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbCollapse,
        NgClass,
        FormsModule,
        TitleCasePipe
    ],
    templateUrl: './annotation-presenter.component.html',
    styleUrl: './annotation-presenter.component.scss'
})
export class AnnotationPresenterComponent implements OnDestroy {
  private _annotations?: Annotation[]
  @Input() set annotations(value: Annotation[]) {
    this._annotations = value
    this.web.checkAnnotationPermissions(value.map((a) => a.id)).subscribe((response) => {
      for (const annotation of response) {
        this.dataService.annotationPermissions[annotation.annotation] = annotation.permission
      }
    })
  }
  get annotations(): Annotation[] {
    return this._annotations!
  }
  @Output() deleteAnnotation: EventEmitter<number> = new EventEmitter<number>();
  @Output() refreshAnnotations: EventEmitter<void> = new EventEmitter<void>();

  commandingAnnotationID: number = -1;
  speechRecognition: any;
  speechTranscript: string = "";
  forceStop: boolean = false;

  // UI state
  collapsedAnnotations: Set<number> = new Set();
  isLoading: Set<number> = new Set();

  // Filter and search
  filterType: string = 'all';
  searchTerm: string = '';

  // Subscriptions
  private subscriptions = new Subscription();
  constructor(
    private web: WebService,
    private modal: NgbModal,
    private modalConfig: NgbModalConfig,
    public dataService: DataService,
    public speech: SpeechService,
    private toastService: ToastService
  ) {
    this.modalConfig.backdrop = 'static';
    this.modalConfig.keyboard = false;

    // Subscribe to speech transcript updates
    this.subscriptions.add(
      this.speech.transcriptSubject.subscribe((transcript) => {
        if (transcript && this.speech.currentAnnotation !== -1) {
          this.handleSpeechTranscript(transcript);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  delete(annotationID: number) {
    this.deleteAnnotation.emit(annotationID);
  }

  download(annotationID: number) {
    this.web.getSignedURL(annotationID).subscribe((token: any) => {
      const a = document.createElement('a');
      a.href = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`;
      a.download = 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
  }

  openTranscribeModal(annotation: Annotation) {
    const ref = this.modal.open(TranscribeModalComponent)
    ref.componentInstance.annotation = annotation
    ref.closed.subscribe((result: any) => {
      if (result["language"]) {
        this.web.postTranscribeRequest(annotation.id, result["language"], result["model"]).subscribe((response: any) => {

        })
      }
    })
  }

  ocrAnnotation(annotation: Annotation) {
    this.web.sketchOCR(annotation.id).subscribe((response: any) => {
      console.log(response)
    })
  }

  scratch(annotation: Annotation) {
    this.web.scratchAnnotation(annotation.id).subscribe((response: Annotation) => {
      annotation.scratched = response.scratched
    })
  }

  updateAnnotation(annotation: Annotation) {
    const permissions = this.dataService.annotationPermissions[annotation.id]
    if (permissions && permissions.edit) {
      this.annotations = this.annotations.map((a) => {
        if (a.id === annotation.id) {
          return annotation
        }
        return a
      })
    }
  }

  annotationRename(annotation: Annotation) {
    const ref = this.modal.open(AnnotationRenameModalComponent)
    ref.componentInstance.annotation = annotation
    ref.closed.subscribe((result: string) => {
      if (result) {
        this.web.annotationRename(annotation.id, result).subscribe((response: Annotation) => {
          annotation.annotation_name = response.annotation_name
        })
      }
    })
  }
  transcriptSummarize(annotation_id: number) {
    this.web.transcriptSummarize(annotation_id).subscribe((response: any) => {
      console.log(response)
    })
  }

  startSpeechRecognition(annotationID: number) {
    if (this.speech.currentAnnotation === annotationID) {
      this.forceStop = true
      this.speechRecognition.stop()
      this.speech.currentAnnotation = -1

      return
    }
    this.speech.currentAnnotation = annotationID;
    this.speechRecognition = this.speech.createSpeechRecognition()
    this.speechRecognition.continuous = true;
    //this.speechRecognition.interimResults = true;
    this.speechRecognition.onresult = (event:any) => {
      let transcript = '';
      /*for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          if (event.results[i][0].transcript.trim().length > 0) {
            transcript += event.results[i][0].transcript;

          }
        }
      }*/
      if (event.results[event.results.length - 1].isFinal) {
        transcript = event.results[event.results.length - 1][0].transcript
      }
      if (transcript.trim().length > 0) {
        this.speech.transcriptSubject.next(transcript)
      }

    }
    this.speechRecognition.onend = (event:any) => {
      console.log(event, "end")
      if (this.forceStop) {
        this.speechRecognition.stop()
        setTimeout(() => {
          this.forceStop = false
        }, 200)
      } else {
        this.speechRecognition.start()
      }
      //this.speechRecognition.stop()
      //this.speech.currentAnnotation = -1
    }
    this.speechRecognition.onstart = (event:any) => {
      console.log(event)
    }
    this.speechRecognition.start();
  }

  addMetadata(annotation: Annotation) {
    const ref = this.modal.open(AnnotationMetadataModalComponent)
    ref.componentInstance.annotation = annotation
    ref.closed.subscribe((result) => {
      if (result) {
        this.toastService.show('Metadata', 'Metadata added successfully');
        this.refreshAnnotations.emit();
      }
    });
  }

  // Enhanced filtering and search functionality
  get filteredAnnotations(): Annotation[] {
    if (!this.annotations) return [];

    let filtered = this.annotations;

    // Apply type filter
    if (this.filterType !== 'all') {
      filtered = filtered.filter(a => a.annotation_type === this.filterType);
    }

    // Apply search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.annotation_name && a.annotation_name.toLowerCase().includes(searchLower)) ||
        (a.annotation && a.annotation.toLowerCase().includes(searchLower)) ||
        (a.user && a.user.username.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }

  // Get unique annotation types for filter dropdown
  get availableTypes(): string[] {
    if (!this.annotations) return [];
    const types = [...new Set(this.annotations.map(a => a.annotation_type))];
    return types.sort();
  }

  // Collapse/expand annotation
  toggleCollapse(annotationId: number) {
    if (this.collapsedAnnotations.has(annotationId)) {
      this.collapsedAnnotations.delete(annotationId);
    } else {
      this.collapsedAnnotations.add(annotationId);
    }
  }

  isCollapsed(annotationId: number): boolean {
    return this.collapsedAnnotations.has(annotationId);
  }

  // Enhanced delete with confirmation
  deleteWithConfirmation(annotationId: number, annotationName?: string) {
    const name = annotationName || 'this annotation';
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      this.delete(annotationId);
    }
  }

  // Batch operations
  toggleCollapseAll() {
    if (this.collapsedAnnotations.size === this.filteredAnnotations.length) {
      this.collapsedAnnotations.clear();
    } else {
      this.filteredAnnotations.forEach(a => this.collapsedAnnotations.add(a.id));
    }
  }

  // Enhanced download with loading state
  downloadWithLoading(annotationID: number) {
    this.isLoading.add(annotationID);
    this.web.getSignedURL(annotationID).subscribe({
      next: (token: any) => {
        const a = document.createElement('a');
        a.href = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`;
        a.download = 'download';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.isLoading.delete(annotationID);
        this.toastService.show('Download', 'Download started');
      },
      error: (error) => {
        this.isLoading.delete(annotationID);
        this.toastService.show('Download Error', 'Failed to download annotation');
        console.error('Download error:', error);
      }
    });
  }

  // Handle speech transcript for counter annotations
  private handleSpeechTranscript(transcript: string) {
    // This could be enhanced to handle voice commands for counters
    const annotation = this.annotations.find(a => a.id === this.speech.currentAnnotation);
    if (annotation && annotation.annotation_type === 'counter') {
      // Parse voice commands like "add 1", "subtract 2", "reset", etc.
      this.processSpeechCommand(transcript, annotation);
    }
  }

  private processSpeechCommand(transcript: string, annotation: Annotation) {
    const command = transcript.toLowerCase().trim();

    if (command.includes('add') || command.includes('plus')) {
      const number = this.extractNumber(command) || 1;
      this.adjustCounter(annotation, number);
    } else if (command.includes('subtract') || command.includes('minus')) {
      const number = this.extractNumber(command) || 1;
      this.adjustCounter(annotation, -number);
    } else if (command.includes('reset') || command.includes('zero')) {
      this.resetCounter(annotation);
    }
  }

  private extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private adjustCounter(annotation: Annotation, adjustment: number) {
    if (annotation.annotation_type === 'counter' && annotation.annotation) {
      try {
        const data = JSON.parse(annotation.annotation);
        data.current = Math.max(0, Math.min(data.total, data.current + adjustment));
        annotation.annotation = JSON.stringify(data);
        this.updateAnnotation(annotation);
        this.toastService.show('Counter', `Counter adjusted by ${adjustment}`);
      } catch (e) {
        console.error('Error adjusting counter:', e);
      }
    }
  }

  private resetCounter(annotation: Annotation) {
    if (annotation.annotation_type === 'counter' && annotation.annotation) {
      try {
        const data = JSON.parse(annotation.annotation);
        data.current = 0;
        annotation.annotation = JSON.stringify(data);
        this.updateAnnotation(annotation);
        this.toastService.show('Counter', 'Counter reset to zero');
      } catch (e) {
        console.error('Error resetting counter:', e);
      }
    }
  }

  // Enhanced OCR with loading state
  ocrAnnotationWithLoading(annotation: Annotation) {
    this.isLoading.add(annotation.id);
    this.web.sketchOCR(annotation.id).subscribe({
      next: (response: any) => {
        this.isLoading.delete(annotation.id);
        this.toastService.show('OCR', 'OCR processing completed');
        console.log(response);
        this.refreshAnnotations.emit();
      },
      error: (error) => {
        this.isLoading.delete(annotation.id);
        this.toastService.show('OCR Error', 'Failed to process OCR');
        console.error('OCR error:', error);
      }
    });
  }

  // Get annotation type icon
  getAnnotationTypeIcon(type: string): string {
    const iconMap: {[key: string]: string} = {
      'text': 'bi-file-text',
      'image': 'bi-image',
      'audio': 'bi-mic',
      'video': 'bi-camera-video',
      'sketch': 'bi-brush',
      'counter': 'bi-123',
      'checklist': 'bi-check2-square',
      'table': 'bi-table',
      'calculator': 'bi-calculator',
      'mcalculator': 'bi-calculator-fill',
      'alignment': 'bi-align-start',
      'randomization': 'bi-shuffle',
      'instrument': 'bi-tools',
      'file': 'bi-file-earmark'
    };
    return iconMap[type] || 'bi-file';
  }

  // Get annotation type color class
  getAnnotationTypeColor(type: string): string {
    const colorMap: {[key: string]: string} = {
      'text': 'text-primary',
      'image': 'text-success',
      'audio': 'text-info',
      'video': 'text-warning',
      'sketch': 'text-secondary',
      'counter': 'text-danger',
      'checklist': 'text-success',
      'table': 'text-info',
      'calculator': 'text-warning',
      'mcalculator': 'text-warning',
      'alignment': 'text-primary',
      'randomization': 'text-danger',
      'instrument': 'text-dark',
      'file': 'text-muted'
    };
    return colorMap[type] || 'text-muted';
  }
}
