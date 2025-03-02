import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ProtocolSession} from "../../protocol-session";
import {Project, ProjectQuery} from "../../project";

@Component({
    selector: 'app-project-modal',
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
    searchTerm: ['', Validators.required]
  })

  projectQuery?: ProjectQuery

  selectedProjects: Project[] = []

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

  selectProject(project: Project) {
    if (this.selectedProjects.includes(project)) {
      this.selectedProjects = this.selectedProjects.filter((p) => p !== project)
      return
    }
    this.selectedProjects.push(project)
  }

  createProject() {
    if (this.form.valid) {
      // @ts-ignore
      this.web.createProject(this.form.value.name, this.form.value.description).subscribe((project) => {
        this.activeModal.close([project])
      })
    }
  }

  bindProjects() {
    this.activeModal.close(this.selectedProjects)
  }

}
