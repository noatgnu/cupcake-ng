import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';
import { UserStatistics } from '../../user';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';

@Component({
  selector: 'app-user-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-statistics.component.html',
  styleUrl: './user-statistics.component.scss'
})
export class UserStatisticsComponent implements OnInit {
  @Input() userId?: number;
  
  statistics: UserStatistics | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private webService: WebService,
    private toastService: ToastService,
    public accountsService: AccountsService
  ) {}

  ngOnInit() {
    this.loadStatistics();
  }

  loadStatistics() {
    if (this.userId) {
      // If userId is provided, load statistics for that user
      this.loadUserStatistics(this.userId);
    } else if (this.accountsService.loggedIn) {
      // If no userId provided but user is logged in, get current user first
      this.accountsService.getCurrentUser().subscribe({
        next: (user) => {
          this.loadUserStatistics(user.id);
        },
        error: (error) => {
          console.error('Error getting current user:', error);
          this.error = 'Failed to get current user';
          this.loading = false;
        }
      });
    } else {
      this.error = 'No user specified and not logged in';
    }
  }

  private loadUserStatistics(userId: number) {
    this.loading = true;
    this.error = null;

    this.webService.getUserStatistics(userId).subscribe({
      next: (data) => {
        this.statistics = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user statistics:', error);
        this.error = 'Failed to load user statistics';
        this.loading = false;
        this.toastService.show('User Statistics', 'Failed to load statistics');
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  getActivityPercentage(recent: number, total: number): number {
    return total > 0 ? Math.round((recent / total) * 100) : 0;
  }

  refreshStatistics() {
    this.loadStatistics();
  }
}