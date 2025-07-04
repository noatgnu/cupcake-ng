import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {NgbModal, NgbPagination} from '@ng-bootstrap/ng-bootstrap';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import { ImportTracker } from '../../import-tracking';
import { AreYouSureModalComponent } from '../../are-you-sure-modal/are-you-sure-modal.component';
import {KeyValuePipe, NgClass, TitleCasePipe} from "@angular/common";

@Component({
  selector: 'app-import-tracking-detail',
  templateUrl: './import-tracking-detail.component.html',
  imports: [
    NgbPagination,
    NgClass,
    TitleCasePipe,
    KeyValuePipe
  ],
  styleUrls: ['./import-tracking-detail.component.scss']
})
export class ImportTrackingDetailComponent implements OnInit {
  importTracker: ImportTracker | null = null;
  loading = false;
  activeTab = 'overview';

  // Pagination for detailed views
  objectsPage = 1;
  filesPage = 1;
  relationshipsPage = 1;
  pageSize = 20;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webService: WebService,
    private toastService: ToastService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Wait for accounts service to be initialized
    if (this.webService && (this.webService as any).accountsService?.loggedIn !== undefined) {
      this.route.params.subscribe(params => {
        const id = params['id'];
        if (id) {
          this.loadImportDetail(parseInt(id));
        }
      });
    } else {
      // Check every 100ms until accounts are loaded
      const checkAccounts = () => {
        if (this.webService && (this.webService as any).accountsService?.loggedIn !== undefined) {
          this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
              this.loadImportDetail(parseInt(id));
            }
          });
        } else {
          setTimeout(checkAccounts, 100);
        }
      };
      checkAccounts();
    }
  }

  loadImportDetail(id: number): void {
    this.loading = true;

    this.webService.getImportTrackingById(id).subscribe({
      next: (importTracker: ImportTracker) => {
        this.importTracker = importTracker;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading import detail:', error);
        this.toastService.show('Error loading import details', 'error');
        this.loading = false;
        this.router.navigate(['/import-tracking']);
      }
    });
  }

  revertImport(): void {
    if (!this.importTracker) return;

    const modalRef = this.modalService.open(AreYouSureModalComponent);
    modalRef.componentInstance.title = 'Revert Import';
    modalRef.componentInstance.message = `Are you sure you want to revert the import "${this.importTracker.import_id}"? This will permanently delete all imported data and cannot be undone.`;
    modalRef.componentInstance.confirmText = 'Revert Import';
    modalRef.componentInstance.confirmClass = 'btn-warning';

    modalRef.result.then((result) => {
      if (result && this.importTracker) {
        this.performRevert();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  private performRevert(): void {
    if (!this.importTracker) return;

    this.loading = true;

    this.webService.revertImport(this.importTracker.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show(`Import successfully reverted: ${response.message}`, 'success');
          this.loadImportDetail(this.importTracker!.id);
        } else {
          this.toastService.show(`Failed to revert import: ${response.error}`, 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error reverting import:', error);
        this.toastService.show('Error reverting import', 'error');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/import-tracking']);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'completed': 'badge-success',
      'in_progress': 'badge-primary',
      'failed': 'badge-danger',
      'reverted': 'badge-warning'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  formatFileSize(sizeInBytes: number): string {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB < 1) {
      return `${Math.round(sizeInBytes / 1024)} KB`;
    } else if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(1)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getPaginatedObjects() {
    if (!this.importTracker) return [];
    const startIndex = (this.objectsPage - 1) * this.pageSize;
    return this.importTracker.imported_objects.slice(startIndex, startIndex + this.pageSize);
  }

  getPaginatedFiles() {
    if (!this.importTracker) return [];
    const startIndex = (this.filesPage - 1) * this.pageSize;
    return this.importTracker.imported_files.slice(startIndex, startIndex + this.pageSize);
  }

  getPaginatedRelationships() {
    if (!this.importTracker) return [];
    const startIndex = (this.relationshipsPage - 1) * this.pageSize;
    return this.importTracker.imported_relationships.slice(startIndex, startIndex + this.pageSize);
  }

  getObjectTypeBadgeClass(objectType: string): string {
    const typeClasses: { [key: string]: string } = {
      'annotation': 'badge-primary',
      'protocol': 'badge-success',
      'session': 'badge-info',
      'protocolstep': 'badge-warning',
      'reagent': 'badge-secondary'
    };
    return typeClasses[objectType.toLowerCase()] || 'badge-light';
  }

  getObjectsByType(): Array<{key: string, value: number}> {
    if (!this.importTracker?.stats?.objects_by_type) return [];
    const data = this.importTracker.stats.objects_by_type;
    if (typeof data !== 'object' || data === null) return [];
    return Object.keys(data).map(key => ({ key, value: data[key] }));
  }

  getFilesByType(): Array<{key: string, value: number}> {
    if (!this.importTracker?.stats?.files_by_type) return [];
    const data = this.importTracker.stats.files_by_type;
    if (typeof data !== 'object' || data === null) return [];
    return Object.keys(data).map(key => ({ key, value: data[key] }));
  }

  getRelationshipsByField(): Array<{key: string, value: number}> {
    if (!this.importTracker?.stats?.relationships_by_field) return [];
    const data = this.importTracker.stats.relationships_by_field;
    if (typeof data !== 'object' || data === null) return [];
    return Object.keys(data).map(key => ({ key, value: data[key] }));
  }
}
