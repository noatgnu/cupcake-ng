import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WebService } from '../../web.service';
import { User, UserSearchQuery, UserQuery } from '../../user';
import { LabGroup } from '../../lab-group';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-user-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search-modal.component.html',
  styleUrl: './user-search-modal.component.scss'
})
export class UserSearchModalComponent implements OnInit {
  searchQuery: string = '';
  selectedLabGroup: number | null = null;
  selectedRole: 'staff' | 'regular' | '' = '';
  activeOnly: boolean = true;
  Math = Math;

  users: User[] = [];
  labGroups: LabGroup[] = [];
  loading: boolean = false;
  totalCount: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  // Batch selection properties
  selectedUsers: Set<number> = new Set();
  batchMode: boolean = false;
  targetLabGroup: number | null = null;
  batchActionLoading: boolean = false;

  // Typeahead properties
  labGroupSearchQuery: string = '';
  filteredLabGroups: LabGroup[] = [];
  showLabGroupDropdown: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private webService: WebService,
    private toastService: ToastService,
    public accountsService: AccountsService
  ) {}

  ngOnInit() {
    this.loadLabGroups();
    this.searchUsers();
  }

  loadLabGroups() {
    // Load available lab groups for filtering
    this.webService.getLabGroups('', 100, 0).subscribe({
      next: (data) => {
        this.labGroups = data.results;
      },
      error: (error) => {
        console.error('Error loading lab groups:', error);
      }
    });
  }

  searchUsers() {
    this.loading = true;

    const query: UserSearchQuery = {
      q: this.searchQuery || undefined,
      lab_group: this.selectedLabGroup || undefined,
      role: this.selectedRole || undefined,
      active: this.activeOnly
    };

    const offset = (this.currentPage - 1) * this.pageSize;

    this.webService.searchUsers(query, this.pageSize, offset).subscribe({
      next: (data: UserQuery) => {
        this.users = data.results;
        this.totalCount = data.count;
        this.hasNext = !!data.next;
        this.hasPrevious = !!data.previous;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.loading = false;
        this.toastService.show('User Search', 'Failed to search users');
      }
    });
  }

  onSearchChange() {
    // Debounce search
    setTimeout(() => {
      this.currentPage = 1;
      this.searchUsers();
    }, 300);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.searchUsers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedLabGroup = null;
    this.selectedRole = '';
    this.activeOnly = true;
    this.currentPage = 1;
    this.searchUsers();
  }

  getUserFullName(user: User): string {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username;
  }

  selectUser(user: User) {
    this.activeModal.close(user);
  }

  isCurrentUser(user: User): boolean {
    return this.accountsService.username === user.username;
  }

  // Pagination methods
  nextPage() {
    if (this.hasNext) {
      this.currentPage++;
      this.searchUsers();
    }
  }

  previousPage() {
    if (this.hasPrevious) {
      this.currentPage--;
      this.searchUsers();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  close() {
    this.activeModal.dismiss();
  }

  // Batch actions
  toggleBatchMode() {
    this.batchMode = !this.batchMode;
    if (!this.batchMode) {
      this.selectedUsers.clear();
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.has(userId);
  }

  toggleUserSelection(userId: number) {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  selectAllUsers() {
    this.users.forEach(user => this.selectedUsers.add(user.id));
  }

  deselectAllUsers() {
    this.selectedUsers.clear();
  }

  applyBatchAction() {
    if (this.targetLabGroup === null) {
      this.toastService.show('Batch Action', 'Please select a target lab group');
      return;
    }

    this.batchActionLoading = true;

    const userIds = Array.from(this.selectedUsers);

    if (this.targetLabGroup !== null && userIds.length > 0) {
      forkJoin(userIds.map(userId => this.webService.addLabGroupMember(this.targetLabGroup!!, userId))).subscribe(
        () => {
          this.toastService.show('Batch Action', 'Users updated successfully');
          this.batchMode = false;
          this.selectedUsers.clear();
          this.targetLabGroup = null;
          this.searchUsers();
        },
        (error) => {
          console.error('Error applying batch action:', error);
          this.batchActionLoading = false;
          this.toastService.show('Batch Action', 'Failed to apply batch action');
        }
      )
    }
  }

  // Typeahead methods
  onLabGroupSearchChange() {
    this.labGroupSearchQuery = this.labGroupSearchQuery.trim();
    this.filterLabGroups();
    this.showLabGroupDropdown = this.labGroupSearchQuery.length > 0;
  }

  filterLabGroups() {
    if (!this.labGroupSearchQuery) {
      this.filteredLabGroups = this.labGroups.slice(0, 10); // Show first 10 by default
    } else {
      this.filteredLabGroups = this.labGroups.filter(group =>
        group.name.toLowerCase().includes(this.labGroupSearchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(this.labGroupSearchQuery.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
    }
  }

  selectLabGroup(labGroup: LabGroup) {
    this.targetLabGroup = labGroup.id;
    this.labGroupSearchQuery = labGroup.name;
    this.showLabGroupDropdown = false;
  }

  clearLabGroupSelection() {
    this.targetLabGroup = null;
    this.labGroupSearchQuery = '';
    this.showLabGroupDropdown = false;
  }

  onLabGroupInputFocus() {
    this.filterLabGroups();
    this.showLabGroupDropdown = true;
  }

  onLabGroupInputBlur() {
    // Delay hiding dropdown to allow clicking on options
    setTimeout(() => {
      this.showLabGroupDropdown = false;
    }, 200);
  }
}
