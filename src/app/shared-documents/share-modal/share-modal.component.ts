import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, merge, OperatorFunction, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { SharedDocumentService } from '../shared-document.service';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import { SharedDocument, SharedFolder, DocumentShareRequest, FolderShareRequest } from '../shared-document';
import { User, UserQuery } from '../../user';
import { LabGroup, LabGroupQuery } from '../../lab-group';

@Component({
  selector: 'app-share-modal',
  imports: [CommonModule, FormsModule, NgbTypeahead],
  templateUrl: './share-modal.component.html',
  styleUrl: './share-modal.component.scss'
})
export class ShareModalComponent implements OnInit {
  @Input() item: SharedDocument | SharedFolder | null = null;
  @Input() itemType: 'document' | 'folder' = 'document';

  // Selected users and lab groups
  selectedUsers: User[] = [];
  selectedLabGroups: LabGroup[] = [];

  // Permission settings
  permissions = {
    can_view: true,
    can_download: false,
    can_comment: false,
    can_edit: false,
    can_share: false,
    can_delete: false
  };

  // Loading states
  sharing = false;
  error: string | null = null;

  // Typeahead data
  users: User[] = [];
  labGroups: LabGroup[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private sharedDocumentService: SharedDocumentService,
    private webService: WebService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsersAndGroups();
  }

  close(): void {
    this.activeModal.dismiss();
  }

  async loadUsersAndGroups(): Promise<void> {
    try {
      // Load users
      const userResponse = await this.webService.getUsers('', 100, 0).toPromise();
      if (userResponse) {
        this.users = userResponse.results;
      }

      // Load lab groups
      const labGroupResponse = await this.webService.getLabGroups('', 100, 0).toPromise();
      if (labGroupResponse) {
        this.labGroups = labGroupResponse.results;
      }
    } catch (error) {
      console.error('Error loading users and groups:', error);
      this.error = 'Failed to load users and lab groups';
    }
  }

  // User typeahead search
  searchUsers: OperatorFunction<string, readonly User[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.users.filter(user =>
            !this.selectedUsers.some(selected => selected.id === user.id) &&
            (user.username.toLowerCase().includes(term.toLowerCase()) ||
             user.first_name.toLowerCase().includes(term.toLowerCase()) ||
             user.last_name.toLowerCase().includes(term.toLowerCase()) ||
             user.email.toLowerCase().includes(term.toLowerCase()))
          ).slice(0, 10))
    );

  // Lab group typeahead search
  searchLabGroups: OperatorFunction<string, readonly LabGroup[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.labGroups.filter(group =>
            !this.selectedLabGroups.some(selected => selected.id === group.id) &&
            (group.name.toLowerCase().includes(term.toLowerCase()) ||
             group.description.toLowerCase().includes(term.toLowerCase()))
          ).slice(0, 10))
    );

  // Format user for display
  formatUser = (user: User) => `${user.first_name} ${user.last_name} (${user.username})`;

  // Format lab group for display
  formatLabGroup = (group: LabGroup) => group.name;

  // Add user to selection
  onUserSelect(event: any): void {
    event.preventDefault();
    const user = event.item;
    console.log(event)
    if (user && !this.selectedUsers.some(selected => selected.id === user.id)) {
      this.selectedUsers.push(user);
    }
  }

  // Add lab group to selection
  onLabGroupSelect(event: any): void {
    event.preventDefault();
    const group = event.item;
    if (group && !this.selectedLabGroups.some(selected => selected.id === group.id)) {
      this.selectedLabGroups.push(group);
    }
  }

  // Remove user from selection
  removeUser(user: User): void {
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
  }

  // Remove lab group from selection
  removeLabGroup(group: LabGroup): void {
    this.selectedLabGroups = this.selectedLabGroups.filter(g => g.id !== group.id);
  }

  // Share the item
  async shareItem(): Promise<void> {
    if (!this.item || (this.selectedUsers.length === 0 && this.selectedLabGroups.length === 0)) {
      this.error = 'Please select at least one user or lab group to share with.';
      return;
    }

    this.sharing = true;
    this.error = null;

    try {
      if (this.itemType === 'folder') {
        const request: FolderShareRequest = {
          folder_id: this.item.id,
          users: this.selectedUsers.length > 0 ? this.selectedUsers.map(u => u.id) : undefined,
          lab_groups: this.selectedLabGroups.length > 0 ? this.selectedLabGroups.map(g => g.id) : undefined,
          permissions: this.permissions
        };

        await this.sharedDocumentService.shareFolder(request).toPromise();
        this.toastService.show('Success', 'Folder shared successfully', 3000, 'success');
      } else {
        const request: DocumentShareRequest = {
          users: this.selectedUsers.length > 0 ? this.selectedUsers.map(u => u.id) : undefined,
          lab_groups: this.selectedLabGroups.length > 0 ? this.selectedLabGroups.map(g => g.id) : undefined,
          permissions: this.permissions
        };

        await this.sharedDocumentService.shareDocument(this.item.id, request).toPromise();
        this.toastService.show('Success', 'Document shared successfully', 3000, 'success');
      }

      this.activeModal.close(true);
    } catch (error: any) {
      console.error('Error sharing item:', error);
      this.error = error.error?.detail || error.message || 'Failed to share item';
      this.toastService.show('Error', 'Failed to share item', 5000, 'danger');
    } finally {
      this.sharing = false;
    }
  }

  // Get item name for display
  getItemName(): string {
    if (!this.item) return '';
    return this.itemType === 'folder' ? (this.item as SharedFolder).name : (this.item as SharedDocument).annotation_name;
  }

  // Set all permissions
  setAllPermissions(enabled: boolean): void {
    Object.keys(this.permissions).forEach(key => {
      if (key !== 'can_view') { // Always keep view permission enabled
        (this.permissions as any)[key] = enabled;
      }
    });
  }
}
