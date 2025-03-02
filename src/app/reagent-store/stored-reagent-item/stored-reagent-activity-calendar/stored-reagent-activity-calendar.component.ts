import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
//@ts-ignore
import CalHeatmap from "cal-heatmap";
import {DataService} from "../../../data.service";
import {ReagentAction, StoredReagent} from "../../../storage-object";
import {WebService} from "../../../web.service";
@Component({
    selector: 'app-stored-reagent-activity-calendar',
    imports: [],
    templateUrl: './stored-reagent-activity-calendar.component.html',
    styleUrl: './stored-reagent-activity-calendar.component.scss'
})
export class StoredReagentActivityCalendarComponent implements AfterViewInit{
  private _storedReagent: StoredReagent|undefined = undefined

  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    this.drawCalendar()
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent!
  }

  @ViewChild('calendar') calendar: ElementRef|undefined
  cal: CalHeatmap|undefined

  startDate: Date = new Date()
  endDate: Date = new Date()
  data: ReagentAction[] = []

  constructor(private dataService: DataService, private web: WebService) {
    this.computeStartAndEndOfMonth()
  }

  computeStartAndEndOfMonth() {
    // Get the current date
    let now = new Date();

    // Get the start date of the time range window
    let startDate = new Date(now.getFullYear(), now.getMonth() - 4, 1);

    // Set the start and end dates
    this.startDate = startDate;
    this.endDate = now;

  }


  ngAfterViewInit() {
    if (this.calendar) {
      if (!this.cal) {
        // @ts-ignore
        this.cal = new CalHeatmap()
      }
      this.drawCalendar()
    }
  }

  drawCalendar() {
    this.web.getStoredReagentActionWithinRange(this.storedReagent!.id, this.startDate, this.endDate).subscribe((data) => {
      this.data = data
      if (this.calendar && this.cal) {
        const options: any = {
          itemSelector: this.calendar.nativeElement,
          range: 5,
          domain: {
            type: 'month',
          },
          subDomain: {
            type: 'day'
          },
          date: {
            start: this.startDate,
            end: this.endDate
          },
          data: {
            source: this.data,
            x: (datum: ReagentAction) => new Date(datum.created_at),
            y: (datum: ReagentAction) => {
              if (datum.action_type === 'add') {
                return +datum.quantity
              }
              return -datum.quantity
            },
            groupY: 'sum'

          },
          scale: {
            color: {
              scheme: 'Cool',
              type: 'linear',
              domain: [-30,30]
            }
          }
        }
        if (this.dataService.darkMode) {
          options.theme = 'dark'
        } else {
          options.theme = 'light'
        }
        this.cal.paint(options).then(() => {

        })
      }

    })
  }


}
