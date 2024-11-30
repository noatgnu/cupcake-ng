import {Component, OnInit} from '@angular/core';
import {AccountsService} from "../accounts.service";
import {WebService} from "../../web.service";
import {AsyncPipe} from "@angular/common";
import {LabGroup, LabGroupQuery} from "../../lab-group";
import {NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {EditLabGroupModalComponent} from "./edit-lab-group-modal/edit-lab-group-modal.component";

@Component({
  selector: 'app-lab-group',
  standalone: true,
  imports: [
    NgbTooltip
  ],
  templateUrl: './lab-group.component.html',
  styleUrl: './lab-group.component.scss'
})
export class LabGroupComponent implements OnInit {

  labGroupQuery!: LabGroupQuery

  constructor(public accountsService: AccountsService, private web: WebService, private modal: NgbModal) { }

  ngOnInit() {
    this.web.getLabGroups().subscribe((data) => {
      this.labGroupQuery = data
    })
  }

  editLabGroup(labGroup: LabGroup) {
    const ref = this.modal.open(EditLabGroupModalComponent)
    ref.componentInstance.labGroup = labGroup
    ref.closed.subscribe((data) => {
      if (data) {
        this.web.updateLabGroup(data.id, data.name, data.description).subscribe((data) => {
          this.labGroupQuery.results = this.labGroupQuery.results.map((labGroup) => {
            if (labGroup.id === data.id) {
              return data
            } else {
              return labGroup
            }
          })
        })
      }
    })
  }

  deleteLabGroup(labGroup: LabGroup) {
    this.web.deleteLabGroup(labGroup.id).subscribe(() => {
      this.web.getLabGroups().subscribe((data) => {
        this.labGroupQuery = data
      })
    })
  }

  addLabGroup() {
    const ref = this.modal.open(EditLabGroupModalComponent)
    ref.closed.subscribe((data) => {
      if (data) {
        this.web.createLabGroup(data.name, data.description).subscribe((data) => {
          this.web.getLabGroups().subscribe((data) => {
            this.labGroupQuery = data
          })
        })
      }
    })
  }
}
