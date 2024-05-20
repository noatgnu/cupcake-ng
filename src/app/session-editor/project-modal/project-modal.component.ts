import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ProtocolSession} from "../../protocol-session";
import {ProjectQuery} from "../../project";

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss'
})
export class ProjectModalComponent {
  @Input() session?: ProtocolSession

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
  })

  searchForm = this.fb.group({
    searchTerm: ['']
  })

  projectQuery?: ProjectQuery

  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal, private web: WebService) {
    this.searchForm.controls.searchTerm.valueChanges.subscribe((value) => {
      if (value) {
        if (value.length > 2) {
          this.web.getProjects(undefined, 5, 0, value).subscribe((projectQuery) => {
            this.projectQuery = projectQuery
          })
        }
      }
    })

  }

  close() {
    this.activeModal.dismiss()
  }

}
