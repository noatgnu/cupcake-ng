import { Component } from '@angular/core';
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-add-step-modal',
  standalone: true,
  imports: [],
  templateUrl: './add-step-modal.component.html',
  styleUrl: './add-step-modal.component.scss'
})
export class AddStepModalComponent {

  form = this.fb.group({

  })

  constructor(private fb: FormBuilder) {
  }

}
