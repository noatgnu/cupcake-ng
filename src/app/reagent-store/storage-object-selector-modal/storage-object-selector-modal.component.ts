import { Component, Input, OnInit } from '@angular/core';
import {ReactiveFormsModule, FormsModule, FormControl, FormBuilder} from "@angular/forms";
import {NgbActiveModal, NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {debounceTime, distinctUntilChanged} from "rxjs";
import {StorageObject} from "../../storage-object";

@Component({
  selector: 'app-storage-object-selector-modal',
  imports: [
    ReactiveFormsModule,
    NgbPagination
  ],
  templateUrl: './storage-object-selector-modal.component.html',
  styleUrl: './storage-object-selector-modal.component.scss'
})
export class StorageObjectSelectorModalComponent implements OnInit {
  @Input() title = 'Select Storage Location';
  @Input() multiSelect = false;
  @Input() excludeIds: number[] = [];

  storageObjects: StorageObject[] = [];
  selectedObjects: StorageObject[] = [];
  isLoading = false;
  totalCount = 0;

  currentPage = 1;
  pageSize = 10;

  searchForm = this.fb.group({
    searchTerm: new FormControl('')
  });

  constructor(
    public activeModal: NgbActiveModal,
    private web: WebService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadStorageObjects();

    this.searchForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadStorageObjects();
      });
  }

  loadStorageObjects(): void {
    this.isLoading = true;
    const searchTerm = this.searchForm.get('searchTerm')?.value || '';
    const offset = (this.currentPage - 1) * this.pageSize;

    this.web.getStorageObjects(undefined, this.pageSize, offset, searchTerm, undefined, undefined, this.excludeIds).subscribe({
      next: (response) => {
        this.storageObjects = response.results;
        this.totalCount = response.count;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load storage objects:', error);
        this.isLoading = false;
      }
    });
  }

  toggleSelection(object: StorageObject): void {
    if (this.multiSelect) {
      const index = this.selectedObjects.findIndex(obj => obj.id === object.id);
      if (index > -1) {
        this.selectedObjects.splice(index, 1);
      } else {
        this.selectedObjects.push(object);
      }
    } else {
      this.selectedObjects = [object];
    }
  }

  isSelected(object: StorageObject): boolean {
    return this.selectedObjects.some(obj => obj.id === object.id);
  }

  onPageChange(page: any): void {
    this.currentPage = page;
    this.loadStorageObjects();
  }

  confirm(): void {
    this.activeModal.close(this.selectedObjects);
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }
}
