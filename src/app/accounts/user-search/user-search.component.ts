import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';
import {User, UserBasicQuery, UserQuery, UserSearchQuery} from '../../user';
import { LabGroup } from '../../lab-group';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';
import {UserBasic} from "../../site-settings";

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search.component.html',
  styleUrl: './user-search.component.scss'
})
export class UserSearchComponent implements OnInit {
  searchQuery: string = '';
  selectedLabGroup: number | null = null;
  selectedRole: 'staff' | 'regular' | '' = '';
  activeOnly: boolean = true;
  Math = Math; // Make Math available in template

  users: UserBasic[] = [];
  labGroups: LabGroup[] = [];
  loading: boolean = false;
  totalCount: number = 0;
  currentPage: number = 1;
  pageSize: number = 20;
  hasNext: boolean = false;
  hasPrevious: boolean = false;

  constructor(
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
      next: (data: UserBasicQuery) => {
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

  getUserFullName(user: UserBasic): string {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username;
  }

  viewUserStatistics(user: UserBasic) {
    // This would typically navigate to user statistics view
    console.log('View statistics for user:', user.id);
    this.toastService.show('User Statistics', `Viewing statistics for ${this.getUserFullName(user)}`);
  }

  isCurrentUser(user: UserBasic): boolean {
    return this.accountsService.username === user.username;
  }

  canManageUser(user: UserBasic): boolean {
    return this.accountsService.is_staff || false;
  }

  // Pagination methods
  goToPage(page: number) {
    this.currentPage = page;
    this.searchUsers();
  }

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
}
