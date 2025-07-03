import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet
} from '@ng-bootstrap/ng-bootstrap';
import { WebService } from '../../web.service';
import { UserDashboardData, UserActivitySummary } from '../../user';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLinkButton,
    NgbNavOutlet
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit {
  dashboardData: UserDashboardData | null = null;
  activitySummary: UserActivitySummary | null = null;
  loading: boolean = false;
  error: string | null = null;
  activeTab = 'protocols';

  constructor(
    private webService: WebService,
    private toastService: ToastService,
    public accountsService: AccountsService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadActivitySummary();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    this.webService.getUserDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
        this.toastService.show('Dashboard', 'Failed to load dashboard data');
      }
    });
  }

  loadActivitySummary() {
    this.webService.getUserActivitySummary().subscribe({
      next: (data) => {
        this.activitySummary = data;
      },
      error: (error) => {
        console.error('Error loading activity summary:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }

  refreshDashboard() {
    this.loadDashboardData();
    this.loadActivitySummary();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  navigateToProtocol(protocolId: number) {
    // Navigation will be handled by router
    console.log('Navigate to protocol:', protocolId);
  }

  navigateToSession(sessionId: number) {
    // Navigation will be handled by router
    console.log('Navigate to session:', sessionId);
  }

  navigateToLabGroup(labGroupId: number) {
    // Navigation will be handled by router
    console.log('Navigate to lab group:', labGroupId);
  }
}