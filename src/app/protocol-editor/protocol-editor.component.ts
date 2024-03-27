import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgxWigModule} from "ngx-wig";
import {WebService} from "../web.service";
import {Protocol, ProtocolSection, ProtocolStep} from "../protocol";
import {DataService} from "../data.service";
import {Router} from "@angular/router";
import {TimePickerComponent} from "../time-picker/time-picker.component";

@Component({
  selector: 'app-protocol-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxWigModule,
    FormsModule,
    TimePickerComponent
  ],
  templateUrl: './protocol-editor.component.html',
  styleUrl: './protocol-editor.component.scss'
})
export class ProtocolEditorComponent {

  form = this.fb.group({
    protocol_title: '',
    protocol_description: '',
  })

  steps: FormGroup[] = []
  currentSectionIndex: number = 0
  sections: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}[] = []
  protocol?: Protocol
  _protocolID: number = 0
  @Input() set protocolID(value: number) {
    this._protocolID = value
    this.web.getProtocol(value).subscribe((response: Protocol) => {
      this.protocol = response
      this.dataService.protocol = response
      this.form.patchValue({
        protocol_title: this.protocol.protocol_title,
        protocol_description: this.protocol.protocol_description
      })
      this.steps = this.protocol.steps.map(step => {
        return this.fb.group({
          id: step.id,
          step_description: step.step_description,
          step_duration: step.step_duration,
          step_section: step.step_section
        })
      })
      this.sections = this.protocol.sections.map(section => {
        return {data: section, steps: [], currentStep: 0}
      })

      response.steps.forEach((step) => {
        const section = this.sections.filter((section) => section.data.id === step.step_section)
        if (section.length > 0) {
          section[0].steps.push(step)
        }})
    })
  }
  get protocolID(): number {
    return this._protocolID
  }

  constructor(private fb: FormBuilder, private web: WebService, private dataService: DataService, private router: Router) {

  }

  addStepForm() {
    this.steps.push(this.fb.group({
      step_description: '',
      step_duration: 0,
      step_section: '',
      step_section_duration: 0
    }))
  }

  removeStepForm(index: number) {
    this.steps.splice(index, 1)
  }

  createProtocol() {
    if (this.form.valid) {
      // @ts-ignore
      this.web.createProtocol(this.form.value.protocol_title, this.form.value.protocol_description).subscribe((response: Protocol) => {
        this.protocol = response;
      }, (error) => {
        console.log(error)
      }, () => {
        if (this.protocol) {
          this.router.navigate([`/protocol-editor/${this.protocol.id}`])
        }
      })
    }
  }

  handleUpdateSectionDuration(seconds: number) {
    this.sections[this.currentSectionIndex].data.section_duration = seconds
  }

  addStepToSection(index: number) {
    const step = {
      id: 0,
      next_step: [],
      protocol: this.protocolID,
      step_description: "",
      step_duration: 0,
      step_id: 0,
      step_section: this.sections[index].data.id,
    }

    if (index < this.sections.length - 1) {
      const lastStep = this.getLastStepInSection(index)

    }
    if (this.sections[index].steps.length > 0) {

    }

  }

  getLastStepInSection(index: number) {
    const stepIDinSection = this.sections[index].steps.map(step => step.step_id)
    let lastStep: ProtocolStep| null = null
    for (const step of this.sections[index].steps) {
      if (step.next_step.length === 0) {
        lastStep = step
        break
      } else {
        for (const nextStep of step.next_step) {
          if (!stepIDinSection.includes(nextStep)) {
            lastStep = step
            break
          }
        }
      }
    }
    return lastStep
  }
}
