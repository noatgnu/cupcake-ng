import {Component, Input} from '@angular/core';
import {map} from "rxjs";

@Component({
    selector: 'app-display-modification-parameters-metadata',
    imports: [],
    templateUrl: './display-modification-parameters-metadata.component.html',
    styleUrl: './display-modification-parameters-metadata.component.scss'
})
export class DisplayModificationParametersMetadataComponent {
  private _value = ''
  modificationParameters: {[key: string]: string} = {
    mt: "",
    pp: "",
    ta: "",
    ts: "",
    mm: "",
    ac: "",
    nt: ""
  }

  @Input() set value(value: string| undefined) {
    this.modificationParameters = {}
    if (!value) {
      return
    }
    this._value = value
    const valueSplitted = value.split(";")
    valueSplitted.forEach((v) => {
      const subSplitted = v.split("=")
      if (subSplitted.length === 2) {
        switch (subSplitted[0].trim().toLowerCase()) {
          case "mt":
            this.modificationParameters['mt'] = subSplitted[1].trim()
            break
          case "pp":
            this.modificationParameters['pp'] = subSplitted[1].trim()
            break
          case "ta":
            this.modificationParameters['ta'] = subSplitted[1].trim()
            break
          case "ts":
            this.modificationParameters['ts'] = subSplitted[1].trim()
            break
          case "mm":
            this.modificationParameters['mm'] = subSplitted[1].trim()
            break
          case "ac":
            this.modificationParameters['ac'] = subSplitted[1].trim()
            break
          case "nt":
            this.modificationParameters['nt'] = subSplitted[1].trim()
            break
          default:
            break
        }
      } else if (subSplitted.length === 1) {
        this.modificationParameters['nt'] = subSplitted[0].trim()
      }
    })
  }

  get value(): string {
    return this._value
  }

}
