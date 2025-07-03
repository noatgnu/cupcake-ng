import {Component, OnInit} from '@angular/core';
import {AccountsService} from "../accounts.service";
import {WebService} from "../../web.service";
import {AsyncPipe} from "@angular/common";
import {LabGroup, LabGroupQuery} from "../../lab-group";
import {User} from "../../user";
import {NgbAlert, NgbModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {EditLabGroupModalComponent} from "./edit-lab-group-modal/edit-lab-group-modal.component";
import {
  AddRemoveUserFromGroupModalComponent
} from "./add-remove-user-from-group-modal/add-remove-user-from-group-modal.component";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {LabUserCreationModalComponent} from "../lab-user-creation-modal/lab-user-creation-modal.component";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-lab-group',
    imports: [
        NgbTooltip,
        ReactiveFormsModule,
        NgbPagination,
        NgbAlert
    ],
    templateUrl: './lab-group.component.html',
    styleUrl: './lab-group.component.scss'
})
export class LabGroupComponent implements OnInit {

  labGroupQuery!: LabGroupQuery
  currentUser: User | null = null

  labGroupPage = 1
  labGroupPageSize = 10

  form = this.fb.group({
    name: "",
  })

  signupLink: string = ""

  constructor(private toastService: ToastService, private fb: FormBuilder, public accountsService: AccountsService, private web: WebService, private modal: NgbModal) {
    this.form.controls.name.valueChanges.subscribe((value) => {
      if (value) {
        this.web.getLabGroups(value).subscribe((data) => {
          this.labGroupQuery = data
        })
      }
    })
  }

  pageChanged(event: number) {
    this.labGroupPage = event
    const offset = (this.labGroupPage - 1) * this.labGroupPageSize
    if (this.form.controls.name.value) {
      this.web.getLabGroups(this.form.controls.name.value, this.labGroupPageSize, offset).subscribe((data) => {
        this.labGroupQuery = data
      })
    } else {
      this.web.getLabGroups(undefined, this.labGroupPageSize, offset).subscribe((data) => {
        this.labGroupQuery = data
      })
    }

  }

  ngOnInit() {
    this.web.getLabGroups().subscribe((data) => {
      this.labGroupQuery = data
    })

    // Load current user information including managed lab groups
    this.accountsService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user
      },
      error: (error) => {
        console.error('Error loading current user:', error)
      }
    })
  }

  // Check if current user can manage a specific lab group
  canManageLabGroup(labGroup: LabGroup): boolean {
    // Staff can manage all lab groups
    if (this.accountsService.is_staff) {
      return true
    }

    // Check if user is a manager of this specific lab group
    return this.currentUser?.managed_lab_groups?.some(managedGroup => managedGroup.id === labGroup.id) || false
  }

  editLabGroup(labGroup: LabGroup) {
    const ref = this.modal.open(EditLabGroupModalComponent)
    ref.componentInstance.labGroup = labGroup
    ref.closed.subscribe((data) => {
      if (data) {
        this.web.updateLabGroup(data.id, data.name, data.description, data.default_storage_id, data.service_storage_id, data.is_professional).subscribe((data) => {
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
        this.web.createLabGroup(data.name, data.description, data.is_professional).subscribe(() => {
          this.web.getLabGroups().subscribe((data) => {
            this.labGroupQuery = data
          })
        })
      }
    })
  }

  openAddRemoveUserFromGroupModel(labGroup: LabGroup) {
    const ref = this.modal.open(AddRemoveUserFromGroupModalComponent)
    ref.componentInstance.labGroup = labGroup

  }

  createLabGroupUser(lab_group: LabGroup) {
    const ref = this.modal.open(LabUserCreationModalComponent)
    ref.componentInstance.lab_group = lab_group
    ref.closed.subscribe((data) => {
      if (data) {
        if (data['token']) {
          this.signupLink = window.location.origin + "/#/accounts/signup/" + data['token']
        }
      }
    })
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.signupLink).then(() => {
      this.toastService.show('Copied to clipboard', 'The sign up link has been copied to your clipboard.');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
}
