import { Injectable } from '@angular/core';
import {TimeKeeper} from "./time-keeper";

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  currentTrackingStep: number[] = [];
  remoteTimeKeeper: {[key: string]: TimeKeeper} = {}
  timeKeeper: {[key: string]: {duration: number, current: number, started: boolean, startTime: number, spent: number, previousStop: number}} = {}
  timer: number = 0;
  timeTick: number = 0;
  calculatingTime: boolean = false;
  constructor() {
    this.timeTick = setInterval(() => {
      if (this.calculatingTime) {
        return;
      }
      const timeNow = Date.now();
      this.calculatingTime = true;
      Object.keys(this.timeKeeper).forEach(i => {
        if (this.timeKeeper[i].started && this.timeKeeper[i].current > 0) {
          if (timeNow < this.timeKeeper[i].startTime) {
            this.timeKeeper[i].startTime = timeNow;
          }
          this.timeKeeper[i].spent = (timeNow - this.timeKeeper[i].startTime) / 1000;
          this.timeKeeper[i].current = this.timeKeeper[i].previousStop - this.timeKeeper[i].spent;

          if (this.timeKeeper[i].current <= 0) {
            this.timeKeeper[i].current = 0;
            this.timeKeeper[i].started = false;
          } else {
            this.timeKeeper[i].current = parseFloat(this.timeKeeper[i].current.toFixed(2)); // Round to 2 decimal places
          }
        }
      });
      this.calculatingTime = false;
    }, 100);
  }

  startTimer() {
    this.timer = 0;
    setInterval(() => {
      this.timer++;
      //convert time
    }, 1000);
  }

  convertTime(time: number|null) {
    if (time === null) {
      time = this.timer;
    }
    let minutes = Math.floor(time / 60);
    let seconds = time - minutes * 60;
    let hours = Math.floor(minutes / 60);
    minutes = minutes - hours * 60;
    let secondsString = seconds.toString();
    if (secondsString.length === 1) {
      secondsString = `0${secondsString}`;
    }
    let minutesString = minutes.toString();
    if (minutesString.length === 1) {
      minutesString = `0${minutesString}`;
    }
    let hoursString = hours.toString();
    if (hoursString.length === 1) {
      hoursString = `0${hoursString}`;
    }
    return `${hoursString}:${minutesString}:${secondsString}`;
  }
}
