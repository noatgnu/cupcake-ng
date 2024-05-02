import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {WebService} from "../../web.service";
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {NgbActiveModal, NgbHighlight, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {ProtocolTag, ProtocolTagQuery, Tag, TagQuery} from "../../tag";

@Component({
  selector: 'app-protocol-tag-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    NgbHighlight
  ],
  templateUrl: './protocol-tag-modal.component.html',
  styleUrl: './protocol-tag-modal.component.scss'
})
export class ProtocolTagModalComponent {
  @Input() tags: ProtocolTag[] = []
  @Input() protocolId: number = 0

  searchForm = this.fb.group({
    tag: ["", Validators.required]
  })

  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap((term) => {
          return this.web.searchTags(term)
      }),
      map((data: TagQuery) => {
        console.log(data)
        return data.results
      })
    )
  }



  constructor(private web: WebService, private fb: FormBuilder, private activeModal: NgbActiveModal) {
  }


  tagFormatter = (result: Tag) => {
    console.log(result)
    return result.tag
  }

  addProtocolTag() {
    if (this.searchForm.valid) {
      // @ts-ignore
      this.web.addProtocolTag(this.protocolId, this.searchForm.value.tag).subscribe((data) => {
        this.tags.push(data)
      })
    }
  }

  close() {
    this.activeModal.dismiss()
  }

  save() {
    this.activeModal.close(this.tags)
  }
}
