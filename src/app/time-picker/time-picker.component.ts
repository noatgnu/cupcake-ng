import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss'
})
export class TimePickerComponent {
  form = this.fb.group({
    seconds: new FormControl<number>(0),
    minutes: new FormControl<number>(0),
    hours: new FormControl<number>(0),
  })
  @Output() output: EventEmitter<number> = new EventEmitter<number>()
  _seconds = 0
  @Input() set seconds(value: number) {
    this._seconds = value
    this.form.patchValue({
      seconds: value % 60,
      minutes: Math.floor(value / 60) % 60,
      hours: Math.floor(value / 3600)
    })
  }

  get seconds(): number {
    return this._seconds
  }

  constructor(private fb: FormBuilder) {
    this.form.valueChanges.subscribe((value) => {
      // calculate total seconds
      // @ts-ignore
      const seconds = value.seconds + (value.minutes * 60) + (value.hours * 3600)
      this.output.emit(seconds)
    })
  }


}
