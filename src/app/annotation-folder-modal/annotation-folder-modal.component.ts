import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {AnnotationFolder, AnnotationQuery} from "../annotation";
import {WebService} from "../web.service";
import {AnnotationFileComponent} from "../annotation/annotation-file/annotation-file.component";
import {DataService} from "../data.service";

@Component({
  selector: 'app-annotation-folder-modal',
  imports: [
    AnnotationFileComponent
  ],
  templateUrl: './annotation-folder-modal.component.html',
  styleUrl: './annotation-folder-modal.component.scss'
})
export class AnnotationFolderModalComponent {
  annotationQuery: AnnotationQuery|undefined;
  private _folder: AnnotationFolder|undefined;
  @Input() set folder(folder: AnnotationFolder) {
    this._folder = folder;
    if (folder) {
      this.web.getAnnotationInFolder(folder.id).subscribe((data: AnnotationQuery) => {
        this.annotationQuery = data;
        this.web.checkAnnotationPermissions(data.results.map((a) => a.id)).subscribe((response) => {
          for (const annotation of response) {
            this.dataService.annotationPermissions[annotation.annotation] = annotation.permission
          }
        })
      })
    }
  }

  get folder(): AnnotationFolder|undefined {
    return this._folder;
  }
  constructor(private activeModal: NgbActiveModal, private web: WebService, public dataService: DataService) {
  }

  close() {
    this.activeModal.dismiss();
  }
}
