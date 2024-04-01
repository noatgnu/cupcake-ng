import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {parse} from "@plussub/srt-vtt-parser";
import {NgClass} from "@angular/common";
import {NgbNav, NgbNavItem} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-media-presenter',
  standalone: true,
  imports: [
    NgClass,
    NgbNav,
    NgbNavItem
  ],
  templateUrl: './media-presenter.component.html',
  styleUrl: './media-presenter.component.scss'
})
export class MediaPresenterComponent {
  @ViewChild('audioControlElement') audioControlElement?: ElementRef;
  @ViewChild('videoControlElement') videoControlElement?: ElementRef;
  active = 'transcription'
  _annotation?: Annotation;
  mediaURL: string = ''

  transcription: string = ''
  translation: string = ''
  subtitles: {entries: {from: number, id: string, text: string, to: number}[]} = {entries: []}
  translationSubtitles: {entries: {from: number, id: string, text: string, to: number}[]} = {entries: []}
  currentSubtitleID: number = -1
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    //this.web.getAnnotationImageBlobUrl(value.id).subscribe((url) => {
    //  this.mediaURL = url
    //})
    console.log(value)
    if (value.transcribed) {
      // convert value.transcription text to ObjectURL
      const blob = new Blob([value.transcription], {type: 'text/plain'})
      this.transcription = URL.createObjectURL(blob)
      this.subtitles = parse(value.transcription)
      console.log(this.subtitles)
    }
    if (value.translation !== "") {
      const blob = new Blob([value.translation], {type: 'text/plain'})
      this.translation = URL.createObjectURL(blob)
      this.translationSubtitles = parse(value.translation)
    }
    this.web.getSignedURL(value.id).subscribe((token: any) => {
      this.mediaURL = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`
    })
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  constructor(private web: WebService) { }

  msToTime(duration: number) {
    const milliseconds = Math.floor((duration % 1000) / 100)
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

    hours = (hours < 10) ? 0 + hours : hours
    minutes = (minutes < 10) ? 0 + minutes : minutes
    seconds = (seconds < 10) ? 0 + seconds : seconds
    let strHours = hours.toString()
    if (strHours.length === 1) {
      strHours = "0" + strHours
    }
    let strMinutes = minutes.toString()
    if (strMinutes.length === 1) {
      strMinutes = "0"+strMinutes
    }
    let strSeconds = seconds.toString()

    if (strSeconds.length === 1) {
      strSeconds = "0"+strSeconds
    }
    return strHours + ":" + strMinutes + ":" + strSeconds + "." + milliseconds
  }

  highLightSubtitle(event: any) {
    const currentTime = event.target.currentTime * 1000
    if (this.active === 'transcription') {
      const currentSubtitle = this.subtitles.entries.findIndex((entry) => {
        return currentTime >= entry.from && currentTime <= entry.to
      })
      console.log(currentSubtitle)
      if (currentSubtitle > -1) {
        this.currentSubtitleID = currentSubtitle
      }
    } else {
      const currentSubtitle = this.translationSubtitles.entries.findIndex((entry) => {
        return currentTime >= entry.from && currentTime <= entry.to
      })
      if (currentSubtitle > -1) {
        this.currentSubtitleID = currentSubtitle
      }
    }


  }

  seekToTimePosition(time: number) {
    if (this.annotation?.annotation_type === "audio") {
      if (this.audioControlElement) {
        this.audioControlElement.nativeElement.currentTime = time / 1000
      }
    } else {
      if (this.videoControlElement) {
        this.videoControlElement.nativeElement.currentTime = time / 1000
      }
    }
  }
}
