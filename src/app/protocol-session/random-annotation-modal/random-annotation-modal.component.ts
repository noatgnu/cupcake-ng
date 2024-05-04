import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-random-annotation-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './random-annotation-modal.component.html',
  styleUrl: './random-annotation-modal.component.scss'
})
export class RandomAnnotationModalComponent {

  form = this.fb.group({
    samples: [""],
    nCol: [0],
    nRow: [0],
    generateNumber: [false],
    numberMax: [0],
    numberMin: [0]
  })

  numberArray: any[] = []
  sampleArray: any[] = []

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  close() {
    this.activeModal.dismiss()
  }

  save() {
    this.activeModal.close({numberArray: this.numberArray, sampleArray: this.sampleArray, form: this.form.value})
  }

  randomize() {
    let numberResult: any[] = []
    let result: any[] = []
    const column = this.form.value.nCol
    const row = this.form.value.nRow
    let sample = this.form.value.samples
    const max = this.form.value.numberMax
    const min = this.form.value.numberMin
    if (!column || !row) {
      return
    }
    if (this.form.value.generateNumber) {

      for (let i = 0; i < column; i++) {
        const data = []
        for (let j = 0; j < row; j++) {
          if (!max || !min) {
            return;
          } else {
            data.push(Math.random() * (max - min) + min)
          }
        }
        numberResult.push(data)
      }
      this.numberArray = numberResult
    }
    if (!sample) {
      return
    }
    const samples = sample.replace(/\r/g, "").split("\n").filter((value: string) => value.length > 0)
    if (samples.length === 0) {
      return
    }
    const totalCells = row * column
    if (samples.length > totalCells) {
      return
    }
    let sampleIndex = 0
    // randomize the samples within the table
    const positions = Array.from({length: samples.length}, (_, i) => i)
    positions.sort(() => Math.random() - 0.5)

    for (let i = 0; i < column; i++) {
      const data = []
      // @ts-ignore
      for (let j = 0; j < row; j++) {
        if (sampleIndex < samples.length) {
          data.push(samples[positions[sampleIndex]])
          sampleIndex++
        } else {
          data.push("")
        }
      }
      result.push(data)
    }
    this.sampleArray = result

  }


}
