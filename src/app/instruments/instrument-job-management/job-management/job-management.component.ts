import { Component } from '@angular/core';
import {WebService} from "../../../web.service";
import {InstrumentJobQuery} from "../../../instrument-job";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap} from "rxjs";
import {LabGroup, LabGroupQuery} from "../../../lab-group";
import {NgbPagination, NgbTypeahead, NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-job-management',
    imports: [
        ReactiveFormsModule,
        NgbTypeahead,
        NgbPagination
    ],
    templateUrl: './job-management.component.html',
    styleUrl: './job-management.component.scss'
})
export class JobManagementComponent {
  instrumentJobQuery: InstrumentJobQuery|undefined
  searching = false
  form = this.fb.group({
    job_name: [''],
    mode: [''],
    lab_group_search: [''],
    lab_group: [0],
    status: [''],
    search_engine: [''],
    search_engine_version: [''],
    funder: [''],
    cost_center: [''],
  })

  pageSize: number = 10
  page: number = 1

  constructor(private web: WebService, private fb: FormBuilder) {
    this.web.getInstrumentJobs().subscribe(data => {
      this.instrumentJobQuery = data
    })
  }

  searchLabGroup = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      tap(() => this.searching = true),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          return of([])
        }
        return this.web.getLabGroups(term).pipe(map((labGroups: LabGroupQuery) => labGroups.results))
      }),
      tap(() => this.searching = false)
    )
  }

  selectLabGroup(event: NgbTypeaheadSelectItemEvent) {
    const labGroup = event.item
    this.form.patchValue({lab_group: labGroup.id})
  }

  formatter = (labGroup: LabGroup) => labGroup.name

  search() {
    this.getInstrumentJobs()
  }

  getInstrumentJobs() {
    const offset = (this.page - 1) * this.pageSize
    // @ts-ignore
    this.web.getInstrumentJobs(this.pageSize, offset, this.form.value.job_name, this.form.value.mode, this.form.value.lab_group, this.form.value.status, this.form.value.funder, this.form.value.cost_center, this.form.value.search_engine, this.form.value.search_engine_version).subscribe(data => {
      this.instrumentJobQuery = data
    })
  }

  pageChange(event: number) {
    this.page = event
    this.getInstrumentJobs()
  }

  currentField = ""
  individualFieldSearchValue = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }

        let name = this.currentField;
        if (!name) {
          return of([]);
        }
        name = name.toLowerCase();
        return this.web.instrumentJobIndividualFieldTypeAhead(name, value).pipe(
          map(results => {
            return results.results;
          }), catchError(() => {
            return of([]);
          })
        )
      })
    );
  }

}
