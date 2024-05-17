import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {FormBuilder} from "@angular/forms";
import {SpeechService} from "../../speech.service";

@Component({
  selector: 'app-counter-presenter',
  standalone: true,
  imports: [],
  templateUrl: './counter-presenter.component.html',
  styleUrl: './counter-presenter.component.scss'
})
export class CounterPresenterComponent {
  _annotation?: Annotation

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.data = JSON.parse(value.annotation)
    console.log(this.data)
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>()
  data: {name: string, total: number, current: number} = {name: "", total: 0, current: 0}

  private _commandTranscript = ""
  speechRecognition: any;
  @Input() set commandTranscript(value: string) {
    this._commandTranscript = value.toLowerCase()
    console.log(this._commandTranscript.slice())
    if (this._commandTranscript.indexOf("increas")!= -1) {
      console.log(this._commandTranscript.indexOf("increas"))
      this.data.current += 1
      console.log("increasing")
    } else if (this._commandTranscript.indexOf("decreas")!= -1) {
      console.log(this._commandTranscript.indexOf("decreas"))
      this.data.current -= 1
      console.log("decreasing")
    }
    this.updateAnnotation()
  }



  constructor(private web: WebService, private fb: FormBuilder, public speech: SpeechService) {
    this.speech.transcriptSubject.subscribe((transcript) => {
      this.commandTranscript = transcript
    })
  }

  updateAnnotation() {
    this.web.updateAnnotation(JSON.stringify(this.data), "counter", this.annotation.id).subscribe((data) => {
      this._annotation = data;
      this.change.emit(data)
    })
  }

}
