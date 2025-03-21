import {AfterViewInit, Component, Input} from '@angular/core';
import {NgbActiveModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {LabGroup, LabGroupQuery} from "../lab-group";
import {WebService} from "../web.service";
import {FavouriteMetadataOption} from "../favourite-metadata-option";

@Component({
  selector: 'app-add-favourite-modal',
  imports: [
    ReactiveFormsModule,
    NgbTooltip
  ],
  templateUrl: './add-favourite-modal.component.html',
  styleUrl: './add-favourite-modal.component.scss'
})
export class AddFavouriteModalComponent implements AfterViewInit {
  selectedLabGroup: LabGroup|undefined = undefined
  private _name: string = '';
  @Input() set name(value: string) {
    this._name = value;
  }

  get name() {
    return this._name
  }

  private _type: string = '';
  @Input() set type(value: string) {
    this._type = value;
  }

  get type() {
    return this._type
  }

  private _value: string = '';
  @Input() set value(value: string) {
    this._value = value;
    this.form.controls.display_name.setValue(value)
  }

  get value() {
    return this._value
  }

  form = this.fb.group({
    display_name: [''],
    mode: [''],
    lab_group_search: [''],
  })

  labGroupQuery: LabGroupQuery|undefined = undefined

  alreadyFavouritedLabGroups: LabGroup[] = []
  labGroupFavouriteMap: any = {}
  userFavouriteOption: FavouriteMetadataOption|undefined = undefined


  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {
    this.form.controls.lab_group_search.valueChanges.subscribe(value => {
      if (value) {
        let isProfessional = this.form.value.mode === 'service_lab_group'
        this.web.getUserLabGroups(value, 10, 0, isProfessional).subscribe(lab_groups => {
          this.labGroupQuery = lab_groups
          this.alreadyFavouritedLabGroups = []
          for (let i of lab_groups.results) {
            this.web.getFavouriteMetadataOptions(1,0,this.value,'service_lab_group', i.id, this.name).subscribe(resp => {
              if (resp.results.length > 0) {
                this.alreadyFavouritedLabGroups.push(i)
                for (let j of resp.results) {
                  this.labGroupFavouriteMap[i.id] = j
                }
              }
            })
          }
        })
      }
    })
    this.form.controls.mode.valueChanges.subscribe(value => {
      if (value === 'service_lab_group' || value === 'lab_group') {
        this.userFavouriteOption = undefined
        let isProfessional = value === 'service_lab_group'
        this.alreadyFavouritedLabGroups = []
        this.web.getUserLabGroups(value, 10, 0, isProfessional).subscribe(lab_groups => {
          this.labGroupQuery = lab_groups
          for (let i of lab_groups.results) {
            this.web.getFavouriteMetadataOptions(1,0,this.value,'service_lab_group', i.id, this.name).subscribe(resp => {
              if (resp.results.length > 0) {
                this.alreadyFavouritedLabGroups.push(i)
                for (let j of resp.results) {
                  this.labGroupFavouriteMap[i.id] = j
                }
              }
            })
          }
        })
      } else {
        this.labGroupQuery = undefined
        this.selectedLabGroup = undefined
        this.alreadyFavouritedLabGroups = []
        this.web.getFavouriteMetadataOptions(1,0,this.value, 'user', undefined, this.name).subscribe(resp => {
          if (resp.results.length > 0) {
            this.userFavouriteOption = resp.results[0]
            this.form.controls.display_name.setValue(this.userFavouriteOption.display_value)
          }
        })
      }
    })

  }

  ngAfterViewInit() {
    this.web.getFavouriteMetadataOptions(1,0,this.value, 'user', undefined, this.name).subscribe(resp => {
      if (resp.results.length > 0) {
        this.userFavouriteOption = resp.results[0]
        this.form.controls.display_name.setValue(this.userFavouriteOption.display_value)
      }
    })
  }

  close() {
    this.activeModal.dismiss();
  }

  submit() {
    if (this.selectedLabGroup) {
      this.activeModal.close({lab_group: this.selectedLabGroup.id, ...this.form.value})
    } else {
      this.activeModal.close({...this.form.value})
    }
  }

  removeFavouriteLabGroup(labGroup: LabGroup) {
    if (this.labGroupFavouriteMap[labGroup.id]) {
      console.log(this.labGroupFavouriteMap[labGroup.id])
      this.web.deleteFavouriteMetadataOption(this.labGroupFavouriteMap[labGroup.id].id).subscribe(resp => {
        this.alreadyFavouritedLabGroups = this.alreadyFavouritedLabGroups.filter(l => l.id !== labGroup.id)
        delete this.labGroupFavouriteMap[labGroup.id]
      })
    }
  }

  selectLabGroup(labGroup: LabGroup) {
    if (this.alreadyFavouritedLabGroups.includes(labGroup)) {
      return
    }
    if (this.selectedLabGroup === labGroup) {
      this.selectedLabGroup = undefined
      return
    }
    this.selectedLabGroup = labGroup
  }

  removeFavouriteUser() {
    if (this.userFavouriteOption) {
      this.web.deleteFavouriteMetadataOption(this.userFavouriteOption.id).subscribe(resp => {
        this.userFavouriteOption = undefined
      })
    }
  }
}
