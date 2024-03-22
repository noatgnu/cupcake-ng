import { Injectable } from '@angular/core';

declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;
declare var SpeechGrammarList: any;
declare var webkitSpeechGrammarList: any;
declare var SpeechRecognitionEvent: any;
declare var webkitSpeechRecognitionEvent: any;
@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  speechRecognition: any
  speechGrammarList: any
  speechRecognitionEvent: any
  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = webkitSpeechRecognition;
    } else if ('SpeechRecognition' in window) {
      this.speechRecognition = SpeechRecognition;
    }

    if ('webkitSpeechGrammarList' in window) {
      this.speechGrammarList = webkitSpeechGrammarList;
    } else if ('SpeechGrammarList' in window) {
      this.speechGrammarList = SpeechGrammarList;
    }

    if ('webkitSpeechRecognitionEvent' in window) {
      this.speechRecognitionEvent = webkitSpeechRecognitionEvent;
    } else if ('SpeechRecognitionEvent' in window) {
      this.speechRecognitionEvent = SpeechRecognitionEvent;
    }
    console.log(this.speechRecognition, this.speechGrammarList, this.speechRecognitionEvent)
  }

  createSpeechRecognition() {
    return new this.speechRecognition();
  }
}
