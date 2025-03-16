import {Component, ViewChild} from '@angular/core';
import {AccountsService} from "../../../accounts/accounts.service";
import {ToastService} from "../../../toast.service";
import {WebService} from "../../../web.service";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbAlert, NgbDate, NgbDatepicker, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction, Subscription, switchMap} from "rxjs";
import {LabGroup} from "../../../lab-group";
import {User} from "../../../user";
import {Instrument} from "../../../instrument";
import {environment} from "../../../../environments/environment";
import {WebsocketService} from "../../../websocket.service";

@Component({
  selector: 'app-export-bookings',
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    NgbDatepicker,
    NgbAlert
  ],
  templateUrl: './export-bookings.component.html',
  styleUrl: './export-bookings.component.scss'
})
export class ExportBookingsComponent {
  hoveredDate: NgbDate | null = null;
  dateBeforeCurrent: Date = new Date();
  dateAfterCurrent: Date = new Date();
  fromDate: NgbDate = new NgbDate(this.dateBeforeCurrent.getFullYear(), this.dateBeforeCurrent.getMonth(), this.dateBeforeCurrent.getDate());
  toDate: NgbDate | null = new NgbDate(this.dateAfterCurrent.getFullYear(), this.dateAfterCurrent.getMonth() + 1, this.dateAfterCurrent.getDate());
  @ViewChild('dp') dp!: NgbDatepicker
  form = this.fb.group({
    mode: ['user'],
    dataSearch: [''],
    splitted_boundaries_calculation: [false],
    file_format: ['xlsx']
  })

  selectedList: any[] = []
  instrumentList: Instrument[] = []

  instrumentJobWebsocketSubscription: Subscription|undefined;

  constructor(private toast: ToastService, private ws: WebsocketService, private accounts: AccountsService, private web: WebService, private toastService: ToastService, private fb: FormBuilder) {
    if (this.ws.instrumentJobWSConnection) {
      this.instrumentJobWebsocketSubscription = this.ws.instrumentJobWSConnection.subscribe((message: any) => {
        if ("signed_value" in message && "instance_id" in message) {
          if (message['instance_id'] === this.web.cupcakeInstanceID) {
            this.toast.show("Export File", "Downloading file...")
            const downloadURL = environment.baseURL + "/api/protocol/download_temp_file/?token=" + message["signed_value"]
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = message["signed_value"].split(":")[0]
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else if ("instance_id" in message && "status" in message && "message" in message) {
          if (message['instance_id'] === this.web.cupcakeInstanceID) {
            console.log(message)
            if (message['status'] === 'error') {
              this.toast.show("Export File", message['message'])
            } else if (message['status'] === 'completed') {
              this.toast.show("Export File", message['message'])
            }
          }
        }
      })
    }
    this.form.controls.mode.valueChanges.subscribe(() => {
      this.selectedList = []
    })
  }

  dataSearch: OperatorFunction<string, any> = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((searchText) => {
        if (this.form.value.mode === 'user') {
          return this.web.getUsers(undefined, 10, 0, searchText).pipe(
            map((data) => {
              return data.results;
            })
          );
        } else {
          return this.web.getLabGroups(searchText, 10, 0, true).pipe(
            map((data) => {
              return data.results;
            }
          ))
        }
      })
    )
  }

  formatter = ( x: any) => {
    if (x['username']) {
      return x['username'];
    } else {
      return x['name'];
    }
  }

  selectItem(event: any) {
    this.selectedList.push(event.item);
  }

  removeItem(item: any) {
    // @ts-ignore
    this.selectedList = this.selectedList.filter((x:any) => x !== item);
  }

  instrumentSearch: OperatorFunction<string, any> = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((searchText) => {
        return this.web.getInstruments(undefined, 10, 0, searchText).pipe(
          map((data) => {
            return data.results;
          })
        )
      })
    )
  }

  instrumentFormatter = (x: Instrument) => {
    return x.instrument_name;
  }

  selectInstrument(event: any) {
    this.instrumentList.push(event.item);
  }

  removeInstrument(item: Instrument) {
    this.instrumentList = this.instrumentList.filter((x) => x !== item);
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  dateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  exportData() {
    console.log(this.fromDate);
    console.log(this.toDate);
    const fromDate = new Date(this.fromDate.year, this.fromDate.month-1, this.fromDate.day);
    if (this.toDate) {
      const toDate = new Date(this.toDate.year, this.toDate.month-1, this.toDate.day);
      if (this.selectedList.length > 0) {
        if (this.form.value.mode === 'user') {
          // @ts-ignore
          this.web.exportUsage(this.instrumentList.map((i) => i.id), fromDate, toDate, [], this.selectedList.map((s) =>s.id), this.form.value.mode, this.form.value.splitted_boundaries_calculation, this.web.cupcakeInstanceID, this.form.value.file_format).subscribe(() => {

          });
        } else {
          // @ts-ignore
          this.web.exportUsage(this.instrumentList.map((i) => i.id), fromDate, toDate, this.selectedList.map((s) =>s.id), [], this.form.value.mode, this.form.value.splitted_boundaries_calculation, this.web.cupcakeInstanceID, this.form.value.file_format).subscribe(() => {

          });
        }
      }
    }


  }
}
