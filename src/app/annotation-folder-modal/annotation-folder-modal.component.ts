import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {AnnotationFolder, AnnotationQuery} from "../annotation";
import {WebService} from "../web.service";
import {AnnotationFileComponent} from "../annotation/annotation-file/annotation-file.component";
import {DataService} from "../data.service";
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-annotation-folder-modal',
  imports: [
    AnnotationFileComponent,
    NgbPagination
  ],
  templateUrl: './annotation-folder-modal.component.html',
  styleUrl: './annotation-folder-modal.component.scss'
})
export class AnnotationFolderModalComponent {
  annotationQuery: AnnotationQuery|undefined;
  private _folder: AnnotationFolder|undefined;
  pageSize = 5;
  currentAnnotationPage = 1;
  @Input() set folder(folder: AnnotationFolder) {
    this._folder = folder;
    if (folder) {
      this.getAnnotation()
    }
  }


  get folder(): AnnotationFolder|undefined {
    return this._folder;
  }

  form = this.fb.group({
    searchTerm: ['']
  })

  constructor(private activeModal: NgbActiveModal, private web: WebService, public dataService: DataService, private fb: FormBuilder) {
  }

  close() {
    this.activeModal.dismiss();
  }

  getAnnotation() {
    if (this.folder) {
      this.web.getAnnotationInFolder(this.folder.id, this.pageSize, (this.currentAnnotationPage - 1) * this.pageSize).subscribe((data: AnnotationQuery) => {
        this.annotationQuery = data;
        this.web.checkAnnotationPermissions(data.results.map((a) => a.id)).subscribe((response) => {
          for (const annotation of response) {
            this.dataService.annotationPermissions[annotation.annotation] = annotation.permission
          }
        })
      })
    }
  }

  handlePageChange(page: number) {
    this.currentAnnotationPage = page;
    this.getAnnotation()
  }
}
