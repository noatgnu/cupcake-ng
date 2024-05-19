import {Component, Input} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgxWigModule} from "ngx-wig";
import {WebService} from "../web.service";
import {Protocol, ProtocolSection, ProtocolStep} from "../protocol";
import {DataService} from "../data.service";
import {Router} from "@angular/router";
import {TimePickerComponent} from "../time-picker/time-picker.component";
import {ToastService} from "../toast.service";
import {
  NgbDate,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu, NgbDropdownToggle,
  NgbModal,
  NgbModalConfig
} from "@ng-bootstrap/ng-bootstrap";
import {ContentChange, QuillEditorComponent, SelectionChange} from "ngx-quill";
import {UserEditorModalComponent} from "./user-editor-modal/user-editor-modal.component";
import {UserViewerModalComponent} from "./user-viewer-modal/user-viewer-modal.component";
import {ReagentEditorComponent} from "./reagent-editor/reagent-editor.component";
import {ProtocolReagent, ProtocolStepReagent} from "../reagent";
import {CalculatorAnnotationComponent} from "../protocol-session/calculator-annotation/calculator-annotation.component";
import {ProtocolTagModalComponent} from "./protocol-tag-modal/protocol-tag-modal.component";
import {ProtocolTag} from "../tag";
import {StepDescriptionEditorComponent} from "./step-description-editor/step-description-editor.component";
import {
  StepDescriptionPreviewModalComponent
} from "./step-description-preview-modal/step-description-preview-modal.component";

@Component({
  selector: 'app-protocol-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxWigModule,
    FormsModule,
    TimePickerComponent,
    QuillEditorComponent,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    CalculatorAnnotationComponent,
    StepDescriptionEditorComponent
  ],
  templateUrl: './protocol-editor.component.html',
  styleUrl: './protocol-editor.component.scss'
})
export class ProtocolEditorComponent {
  viewTemplateTagMap: any = {}
  form = this.fb.group({
    protocol_title: '',
    protocol_description: '',
    enabled: false
  })

  formSectionSelect: FormGroup = this.fb.group({
    currentSection: new FormControl<number>(0)
  })

  editorConfig = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'align': [] }],

        ['clean'],                                         // remove formatting button

        ['link', 'image', 'video']                         // link and image, video
      ]
    }
  }

  steps: FormGroup[] = []
  sections: {data: ProtocolSection, steps: ProtocolStep[], currentStep: number}[] = []
  protocol?: Protocol
  _protocolID: number = 0
  floatedClick?: string
  @Input() set protocolID(value: number) {
    if (!value) {
      return
    }
    console.log(this.protocol)
    this._protocolID = value
    this.toastService.show("Loading", "Protocol")
    this.web.getProtocol(value).subscribe((response: Protocol) => {
      this.protocol = response
      console.log(response)
      this.dataService.protocol = response
      this.form.patchValue({
        protocol_title: this.protocol.protocol_title,
        protocol_description: this.protocol.protocol_description,
        enabled: this.protocol.enabled
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
      this.toastService.show("Protocol", "Loaded")
    })
  }
  get protocolID(): number {
    return this._protocolID
  }

  constructor(private modal: NgbModal, private modalConfig: NgbModalConfig, private fb: FormBuilder, private web: WebService, public dataService: DataService, private router: Router, private toastService: ToastService) {
    this.modalConfig.backdrop = 'static'
    this.modalConfig.keyboard = false
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
    this.sections[this.formSectionSelect.value.currentSection].data.section_duration = seconds
  }

  addStepToSection(index: number) {
    this.web.createProtocolStep(this.protocolID, "", 0, this.sections[this.formSectionSelect.value.currentSection].data.id).subscribe((response: ProtocolStep) => {
      this.toastService.show("Step", "Created")
      this.sections[this.formSectionSelect.value.currentSection].steps.push(response)
    })
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

  handleUpdateStepDuration(seconds: number, index: number) {
    this.sections[this.formSectionSelect.value.currentSection].steps[index].step_duration = seconds
  }

  deleteStep(step: number) {
    this.web.deleteProtocolStep(step).subscribe(() => {
      this.toastService.show("Step", "Deleted")
      this.sections[this.formSectionSelect.value.currentSection].steps = this.sections[this.formSectionSelect.value.currentSection].steps.filter(s => s.id !== step)
    })
  }

  moveStep(step: number, up: boolean = true) {
    this.web.moveProtocolStep(step, up).subscribe((data) => {
      const index = this.sections[this.formSectionSelect.value.currentSection].steps.findIndex(s => s.id === step)
      if (up) {
        if (index > 0) {
          const temp = this.sections[this.formSectionSelect.value.currentSection].steps[index - 1]
          this.sections[this.formSectionSelect.value.currentSection].steps[index - 1] = this.sections[this.formSectionSelect.value.currentSection].steps[index]
          this.sections[this.formSectionSelect.value.currentSection].steps[index] = temp
        }
      } else {
        if (index < this.sections[this.formSectionSelect.value.currentSection].steps.length - 1) {
          const temp = this.sections[this.formSectionSelect.value.currentSection].steps[index + 1]
          this.sections[this.formSectionSelect.value.currentSection].steps[index + 1] = this.sections[this.formSectionSelect.value.currentSection].steps[index]
          this.sections[this.formSectionSelect.value.currentSection].steps[index] = temp
        }
      }

    })
  }

  createNewSection() {
    this.web.createProtocolSection(this.protocolID, "", 0).subscribe((response: ProtocolSection) => {
      this.toastService.show("Section", "Created")
      this.sections.push({data: response, steps: [], currentStep: 0})
      this.formSectionSelect.patchValue({currentSection: this.sections.length - 1})
      this.web.createProtocolStep(this.protocolID, "", 0, response.id).subscribe((responseStep: ProtocolStep) => {
        this.toastService.show("Step", "Created")
        this.sections[this.formSectionSelect.value.currentSection].steps.push(responseStep)
      })
    })
  }

  deleteSection() {
    this.web.deleteSection(this.sections[this.formSectionSelect.value.currentSection].data.id).subscribe(() => {
      this.toastService.show("Section", "Deleted")
      this.sections.splice(this.formSectionSelect.value.currentSection, 1)
    })
  }

  saveSection() {
    this.web.updateProtocolSection(this.sections[this.formSectionSelect.value.currentSection].data.id, this.sections[this.formSectionSelect.value.currentSection].data.section_description, this.sections[this.formSectionSelect.value.currentSection].data.section_duration).subscribe(() => {
      this.toastService.show("Section", "Saved")
      for (const step of this.sections[this.formSectionSelect.value.currentSection].steps) {
        this.web.updateProtocolStep(step.id, step.step_description, step.step_duration).subscribe((data) => {
          step.step_duration = data.step_duration
          step.step_description = data.step_description
        })
      }
    })
  }

  saveProtocol() {
    // @ts-ignore
    this.web.updateProtocol(this.protocolID, this.form.value.protocol_title, this.form.value.protocol_description, this.form.value.enabled).subscribe(() => {
      this.toastService.show("Protocol", "Saved")
    })
  }

  handleDateSelect(date: NgbDate) {

  }

  viewEditorModal() {
    const ref = this.modal.open(UserEditorModalComponent, {scrollable: true})
    ref.componentInstance.protocolId = this.protocolID

  }

  viewViewerModal() {
    const ref = this.modal.open(UserViewerModalComponent, {scrollable: true})
    ref.componentInstance.protocolId = this.protocolID
  }

  openReagentEditorModal(step: ProtocolStep) {
    const ref = this.modal.open(ReagentEditorComponent, {scrollable: true})
    ref.componentInstance.reagents = step.reagents
    ref.componentInstance.stepId = step.id
    ref.closed.subscribe((data: ProtocolStepReagent[]) => {
      step.reagents = data
      this.web.getProtocolReagents(this.protocolID).subscribe((data: ProtocolReagent[]) => {
        if (this.protocol) {
          this.protocol.reagents = data
        }
      })
    })
  }

  editorFloatClick(clickType: string) {
    this.floatedClick = clickType
  }

  viewProtocolTagModal() {
    const ref = this.modal.open(ProtocolTagModalComponent, {scrollable: true})
    ref.componentInstance.protocolId = this.protocolID
    ref.componentInstance.tags = this.protocol?.tags
    ref.closed.subscribe((data: ProtocolTag[]) => {
      if (this.protocol) {
        this.protocol.tags = data
      }
    })
  }

  clickViewTag(stepReagent: ProtocolStepReagent) {
    if (!(stepReagent.id in this.viewTemplateTagMap)) {
      this.viewTemplateTagMap[stepReagent.id] = true
    } else {
      this.viewTemplateTagMap[stepReagent.id] = !this.viewTemplateTagMap[stepReagent.id]
    }
  }

  previewDescription(step: ProtocolStep) {
    const ref = this.modal.open(StepDescriptionPreviewModalComponent, {scrollable: true})
    ref.componentInstance.step = step
  }
}
