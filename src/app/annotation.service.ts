import { Injectable } from '@angular/core';
import {
  AddSimpleCounterModalComponent
} from "./protocol-session/add-simple-counter-modal/add-simple-counter-modal.component";
import {AddChecklistModalComponent} from "./protocol-session/add-checklist-modal/add-checklist-modal.component";
import {AddTableModalComponent} from "./protocol-session/add-table-modal/add-table-modal.component";
import {
  RandomAnnotationModalComponent
} from "./protocol-session/random-annotation-modal/random-annotation-modal.component";
import {UploadLargeFileModalComponent} from "./upload-large-file-modal/upload-large-file-modal.component";
import {WebService} from "./web.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastService} from "./toast.service";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  clickedInstrumentItem: string = "";
  refreshAnnotation: Subject<boolean> = new Subject<boolean>();

  constructor(private web: WebService, private modal: NgbModal, private toastService: ToastService) { }

  annotationInstrumentMenuClick(item: string, instrument_user_type: "user_annotation"|"staff_annotation", instrument_job_id: number) {
    if (item === 'Counter') {
      const ref = this.modal.open(AddSimpleCounterModalComponent)
      ref.closed.subscribe((data: any) => {
        if (data) {
          const payload: any = {
            total: data.total,
            current: 0,
            name: data.name,
          }
          this.web.saveAnnotationJSON(null, 0, payload, 'counter', instrument_job_id, instrument_user_type).subscribe((data: any) => {
            this.refreshAnnotation.next(true);
          })
        }
      })

    } else if (item === 'Checklist') {
      const ref = this.modal.open(AddChecklistModalComponent)
      ref.closed.subscribe((data: any) => {
        if (data) {
          const payload: any = {
            checkList: [],
            name: data.name
          }
          for (const line of data.checkList.split('\n')) {
            payload.checkList.push({checked: false, content: line.replace('\r', '')})
          }

          this.web.saveAnnotationJSON(null, 0, payload, 'checklist', instrument_job_id, instrument_user_type).subscribe((data: any) => {
            this.refreshAnnotation.next(true);
          })
        }
      })
    } else if (item === 'Table') {
      const ref = this.modal.open(AddTableModalComponent)
      ref.closed.subscribe((data: any) => {
        if (data) {
          const payload: any = {
            nRow: data.nRow,
            nCol: data.nCol,
            name: data.name,
            content: []
          }
          for (let i = 0; i < data.nRow; i++) {
            const modelRow: string[] = []
            for (let j = 0; j < data.nCol; j++) {
              modelRow.push("")
            }
            payload.content.push(modelRow)
          }
          this.web.saveAnnotationJSON(null, 0, payload, 'table', instrument_job_id, instrument_user_type).subscribe((data: any) => {
            this.refreshAnnotation.next(true);
          })
        }
      })
    } else if (item === 'Calculator') {
      this.web.saveAnnotationJSON(null, 0, {}, 'calculator', instrument_job_id, instrument_user_type).subscribe((data: any) => {
        this.refreshAnnotation.next(true);

      })
    } else if (item === 'Molarity Calculator'){
      this.web.saveAnnotationJSON(null, 0, {}, 'mcalculator', instrument_job_id, instrument_user_type).subscribe((data: any) => {

      })
    } else if (item === 'Randomization'){
      const ref = this.modal.open(RandomAnnotationModalComponent, {scrollable: true})
      ref.closed.subscribe((data: any) => {
        this.web.saveAnnotationJSON(null, 0, data, 'randomization', instrument_job_id, instrument_user_type).subscribe((data: any) => {
          this.refreshAnnotation.next(true);
        })
      })
    } else if (item === "Large/Multiple Files"){
      const ref = this.modal.open(UploadLargeFileModalComponent)
      ref.componentInstance.step_id = 0;
      ref.componentInstance.instrument_job_id = instrument_job_id;
      ref.componentInstance.instrument_user_type = instrument_user_type
      ref.dismissed.subscribe((data: any) => {
        this.refreshAnnotation.next(true);
      })

    }else {
      if (this.clickedInstrumentItem === item) {
        this.clickedInstrumentItem = "";
        return;
      }
      this.clickedInstrumentItem = item;
    }

  }
}
