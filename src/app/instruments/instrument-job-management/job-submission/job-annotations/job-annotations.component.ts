import {Component, EventEmitter, Input, Output, ViewChild, ElementRef} from '@angular/core';
import {InstrumentJob} from "../../../../instrument-job";
import {
  AnnotationPresenterComponent
} from "../../../../protocol-session/annotation-presenter/annotation-presenter.component";
import {
  NgbDropdown,
  NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet
} from "@ng-bootstrap/ng-bootstrap";
import {
  HandwrittenAnnotationComponent
} from "../../../../protocol-session/handwritten-annotation/handwritten-annotation.component";
import {
  AnnotationTextFormComponent
} from "../../../../protocol-session/annotation-text-form/annotation-text-form.component";
import {AnnotationService} from "../../../../annotation.service";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-job-annotations',
  imports: [
    AnnotationPresenterComponent,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNav,
    HandwrittenAnnotationComponent,
    AnnotationTextFormComponent,
    NgbNavOutlet,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbDropdown,
    FormsModule
  ],
  templateUrl: './job-annotations.component.html',
  styleUrl: './job-annotations.component.scss'
})
export class JobAnnotationsComponent {
  @Input() job!: InstrumentJob;
  @Input() staffModeAvailable = false;
  @Input() activeTab: 'user' | 'staff' = 'user';
  @Output() activeTabChange: EventEmitter<'user'|'staff'> = new EventEmitter<'user' | 'staff'>();
  @Output() deleteAnnotation: EventEmitter<number> = new EventEmitter<number>();
  @ViewChild('previewVideo') previewVideo?: ElementRef;
  @ViewChild('fastaFileUpload') fastaFileUpload?: ElementRef;

  constructor(public annotationService: AnnotationService) {}

  handleDeleteAnnotation(event: number): void {
    this.deleteAnnotation.emit(event);
  }

  openStaffDataEntryPanel(): void {
    // Implement or emit to parent
  }

  uploadFastaFile(): void {
    if (this.fastaFileUpload) {
      this.fastaFileUpload.nativeElement.click();
    }
  }

}
