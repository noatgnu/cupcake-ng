import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators, FormGroup} from "@angular/forms";
import {LabGroup} from "../../../lab-group";
import {WebService} from "../../../web.service";
import {StorageObject, StorageObjectQuery} from "../../../storage-object";
import {finalize, debounceTime} from "rxjs/operators";
@Component({
    selector: 'app-edit-lab-group-modal',
    imports: [
        ReactiveFormsModule,
        NgbPagination,
        NgbTooltip
    ],
    templateUrl: './edit-lab-group-modal.component.html',
    styleUrl: './edit-lab-group-modal.component.scss'
})
export class EditLabGroupModalComponent {
  private _labGroup: LabGroup | null = null;
  form!: FormGroup;
  currentStorageObjectPage = 1; // Start at 1 for ngbPagination
  storageObjectPageSize = 10;
  storageObjectQuery: StorageObjectQuery | undefined;
  isLoading = false;
  isSaving = false;

  @Input() set labGroup(value: LabGroup) {
    this._labGroup = value;
    if (this.form) {
      this.initFormValues(value);
      this.loadStorageObjects();
    }
  }

  get labGroup(): LabGroup | null {
    return this._labGroup;
  }

  constructor(
    private modal: NgbActiveModal,
    private fb: FormBuilder,
    private web: WebService
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this._labGroup) {
      this.initFormValues(this._labGroup);
      this.loadStorageObjects();
    }

    // Add debounce to search to avoid too many API calls
    this.form.get('search_storage_name')?.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.currentStorageObjectPage = 1; // Reset to first page on new search
        this.loadStorageObjects();
      });
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      default_storage_id: [''],
      search_storage_name: [''],
      service_storage_id: [''],
      is_professional: [false]
    });
  }

  private initFormValues(labGroup: LabGroup): void {
    this.form.patchValue({
      name: labGroup.name || '',
      description: labGroup.description || '',
      is_professional: !!labGroup.is_professional,
      default_storage_id: labGroup.default_storage?.id || '',
      service_storage_id: labGroup.service_storage?.id || ''
    });
  }

  loadStorageObjects(): void {
    if (!this._labGroup) return;

    this.isLoading = true;
    const offset = (this.currentStorageObjectPage - 1) * this.storageObjectPageSize;
    const searchTerm = this.form.get('search_storage_name')?.value || '';

    this.web.getStorageObjectsByLabGroup(
      this._labGroup.id,
      this.storageObjectPageSize,
      offset,
      searchTerm
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => this.storageObjectQuery = data,
      error: (err) => console.error('Failed to load storage objects', err)
    });
  }

  onGetStorageObjectPageChange(page: number): void {
    this.currentStorageObjectPage = page;
    this.loadStorageObjects();
  }

  assignDefaultStorageObject(storageObject: StorageObject): void {
    if (!this._labGroup) return;

    this.form.patchValue({default_storage_id: storageObject.id});
    this._labGroup.default_storage = storageObject;
  }

  removeDefaultStorage(): void {
    if (!this._labGroup) return;

    this.form.patchValue({default_storage_id: ''});
    this._labGroup.default_storage = null;
    this.loadStorageObjects();
  }

  assignServiceStorage(storageObject: StorageObject): void {
    if (!this._labGroup) return;

    this.form.patchValue({service_storage_id: storageObject.id});
    this._labGroup.service_storage = storageObject;
  }

  removeServiceStorage(): void {
    if (!this._labGroup) return;

    this.form.patchValue({service_storage_id: ''});
    this._labGroup.service_storage = null;
  }

  close(): void {
    this.modal.dismiss();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const result = {
      id: this._labGroup?.id,
      name: this.form.value.name,
      description: this.form.value.description,
      default_storage_id: this.form.value.default_storage_id,
      service_storage_id: this.form.value.service_storage_id,
      is_professional: this.form.value.is_professional
    };

    setTimeout(() => {
      this.isSaving = false;
      this.modal.close(result);
    }, 300);
  }
}
