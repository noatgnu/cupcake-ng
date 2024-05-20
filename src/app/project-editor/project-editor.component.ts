import {Component, Input} from '@angular/core';
import {WebService} from "../web.service";
import {Project} from "../project";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../toast.service";

@Component({
  selector: 'app-project-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.scss'
})
export class ProjectEditorComponent {
  private _projectID: number = 0
  project?: Project

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
  })

  @Input() set projectID(value: number) {
    this._projectID = value
    this.web.getProject(value).subscribe(
      (response) => {
        this.project = response
        this.form.patchValue(
          {
            name: this.project.project_name,
            description: this.project.project_description
          }
        )
      }
    )
  }

  get projectID(): number {
    return this._projectID
  }

  constructor(private web: WebService, private fb: FormBuilder, private toastService: ToastService) {
  }

  updateProject() {
    if (this.form.valid) {
      this.toastService.show('Project', "Update initiated")
      // @ts-ignore
      this.web.updateProject(this.projectID, this.form.value.name, this.form.value.description).subscribe(
        (response) => {
          this.project = response
          this.toastService.show('Project', "Update successful")
        }
      )
    }
  }


}
