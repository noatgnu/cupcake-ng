import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';
import { PlatformAnalytics, User, UserSearchQuery } from '../../user';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LabUserCreationModalComponent} from "../lab-user-creation-modal/lab-user-creation-modal.component";
import {UserSearchModalComponent} from "../user-search-modal/user-search-modal.component";

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  analytics: PlatformAnalytics | null = null;
  recentUsers: User[] = [];
  loading: boolean = false;
  error: string | null = null;

  // User action forms
  selectedUserId: number | null = null;
  deactivationReason: string = '';
  showDeactivateModal: boolean = false;
  showReactivateModal: boolean = false;
  signupToken: string | null = null;

  constructor(
    private webService: WebService,
    private toastService: ToastService,
    public accountsService: AccountsService,
    private modal: NgbModal
  ) {}

  ngOnInit() {
    if (!this.accountsService.is_staff) {
      this.error = 'Access denied. Staff privileges required.';
      return;
    }

    this.loadPlatformAnalytics();
    this.loadRecentUsers();
  }

  loadPlatformAnalytics() {
    this.loading = true;
    this.error = null;

    this.webService.getPlatformAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading platform analytics:', error);
        this.error = 'Failed to load platform analytics';
        this.loading = false;
        this.toastService.show('Platform Analytics', 'Failed to load analytics');
      }
    });
  }

  loadRecentUsers() {
    // Load recently joined users (first 10 users)
    const query: UserSearchQuery = {
      active: true
    };

    this.webService.searchUsers(query, 10, 0).subscribe({
      next: (data) => {
        this.recentUsers = data.results;
      },
      error: (error) => {
        console.error('Error loading recent users:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  getActivityGrowth(recent: number, total: number): number {
    return total > 0 ? Math.round((recent / total) * 100) : 0;
  }

  // User Management Actions
  openDeactivateModal(userId: number) {
    this.selectedUserId = userId;
    this.deactivationReason = '';
    this.showDeactivateModal = true;
  }

  openReactivateModal(userId: number) {
    this.selectedUserId = userId;
    this.showReactivateModal = true;
  }

  closeModals() {
    this.showDeactivateModal = false;
    this.showReactivateModal = false;
    this.selectedUserId = null;
    this.deactivationReason = '';
  }

  confirmDeactivateUser() {
    if (!this.selectedUserId) return;

    this.webService.deactivateUser(this.selectedUserId, this.deactivationReason).subscribe({
      next: (response) => {
        this.toastService.show('User Management', response.message);
        this.closeModals();
        this.loadRecentUsers(); // Refresh user list
      },
      error: (error) => {
        console.error('Error deactivating user:', error);
        this.toastService.show('User Management', 'Failed to deactivate user');
      }
    });
  }

  confirmReactivateUser() {
    if (!this.selectedUserId) return;

    this.webService.reactivateUser(this.selectedUserId).subscribe({
      next: (response) => {
        this.toastService.show('User Management', response.message);
        this.closeModals();
        this.loadRecentUsers(); // Refresh user list
      },
      error: (error) => {
        console.error('Error reactivating user:', error);
        this.toastService.show('User Management', 'Failed to reactivate user');
      }
    });
  }

  getUserFullName(user: User): string {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username;
  }

  refreshData() {
    this.loadPlatformAnalytics();
    this.loadRecentUsers();
  }

  navigateToUserSearch() {
    const modal = this.modal.open(UserSearchModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modal.result.then((selectedUser) => {
      if (selectedUser) {
        this.toastService.show('User Selected', `Selected user: ${selectedUser.username}`);
        console.log('Selected user:', selectedUser);
      }
    }).catch(() => {
      // Modal was dismissed
    });
    console.log('Navigate to user search');
  }

  generateSignupToken() {
    const modal = this.modal.open(LabUserCreationModalComponent)
    modal.result.then(data => {
      if (data && data.token) {
        this.signupToken = data.token;
      }
    })
  }

  exportUserData() {
    // This would trigger a platform-wide data export
    console.log('Export platform data');
  }

  protected readonly Math = Math;
}
