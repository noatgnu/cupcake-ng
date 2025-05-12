import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ProtocolStep} from "../../protocol";
import {ContentChange, QuillEditorComponent} from "ngx-quill";
import {FormsModule} from "@angular/forms";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-step-description-editor',
    imports: [
        QuillEditorComponent,
        FormsModule,
        NgbTooltip
    ],
    templateUrl: './step-description-editor.component.html',
    styleUrl: './step-description-editor.component.scss'
})
export class StepDescriptionEditorComponent implements AfterViewInit{
  @ViewChild("editor") quillEditor!: QuillEditorComponent
  @ViewChild("dropdownMenu") dropdownMenu!: ElementRef
  currentCursorIndex: number = 0
  @Input() step?: ProtocolStep
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
  constructor() {
  }
  ngAfterViewInit() {

  }

  quillEditorChange(event: ContentChange, step: ProtocolStep) {
    const index = event.editor.selection.lastRange?.index
    if (index && index >0) {
      this.currentCursorIndex = index
      const text = event.text
      if (text.length > 1) {

        if (text[index] === "%" && text[index - 1] === " ") {
          const range = this.quillEditor.quillEditor.getSelection()
          this.showDropdownAtCursor()
          return
        }
      }
    }
    this.dropdownMenu.nativeElement.style.display = 'none';
  }

  showDropdownAtCursor() {
    const bounds = this.quillEditor.quillEditor.getBounds(this.currentCursorIndex)
    if (!bounds) {
      return
    }

    const container = this.quillEditor.quillEditor.container;
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    const parent = this.quillEditor.editorElem.parentElement
    const toolbar = parent?.querySelector('.ql-toolbar');
    console.log(toolbar)
    if (!toolbar) {
      return
    }
    const toolbarHeight = toolbar.scrollHeight;

    this.dropdownMenu.nativeElement.style.position = 'absolute';
    this.dropdownMenu.nativeElement.style.position = 'absolute';
    this.dropdownMenu.nativeElement.style.left = `${bounds.left +scrollLeft}px`;
    this.dropdownMenu.nativeElement.style.top = `${bounds.top + scrollTop + toolbarHeight}px`;
    this.dropdownMenu.nativeElement.style.display = 'block';
  }

  insertTemplate(reagentID: number, templateType: 'quantity'|'scaled_quantity'|'unit'|'name') {
    if (!this.step) {
      return
    }
    const template = `${reagentID}.${templateType}%`
    this.quillEditor.quillEditor.insertText(this.currentCursorIndex+1, template)
    this.dropdownMenu.nativeElement.style.display = 'none';

    this.step.step_description = this.quillEditor.quillEditor.root.innerHTML

  }

  hasScalableReagents(step: ProtocolStep): boolean {
    return step.reagents.some(r => r.scalable === true);
  }
}
