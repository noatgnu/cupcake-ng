import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {NgbModal, NgbNavModule, NgbTooltipModule, NgbAlertModule, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { SiteSettingsService } from '../site-settings.service';
import { SiteSettings } from '../site-settings';
import { ToastService } from '../toast.service';
import { SiteSettingsFormComponent } from './site-settings-form/site-settings-form.component';
import { AccountsService } from '../accounts/accounts.service';
import { WebService } from '../web.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-site-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbNavModule,
    NgbTooltipModule,
    NgbAlertModule,
    SiteSettingsFormComponent
  ],
  templateUrl: './site-settings.component.html',
  styleUrl: './site-settings.component.scss'
})
export class SiteSettingsComponent implements OnInit {
  activeTab = 'general';
  settings: SiteSettings | null = null;
  loading = false;
  saving = false;
  isStaff = false;
  sidebarCollapsed = false;

  constructor(
    private siteSettingsService: SiteSettingsService,
    private toastService: ToastService,
    private modalService: NgbModal,
    public accountsService: AccountsService,
    private webService: WebService
  ) {}

  ngOnInit(): void {
    // Wait for the app to be fully initialized before proceeding
    this.waitForAppInitialization();
  }

  private waitForAppInitialization(): void {
    // If user is logged in, ensure staff status is properly loaded
    if (this.accountsService.loggedIn) {
      // Fetch staff status to ensure it's current, then proceed
      this.webService.getStaffStatus().subscribe({
        next: (data) => {
          this.accountsService.is_staff = data.is_staff;
          this.checkStaffPermissions();
          this.loadSettings();
        },
        error: (error) => {
          console.error('Error fetching staff status:', error);
          // Proceed with current staff status even if fetch fails
          this.checkStaffPermissions();
          this.loadSettings();
        }
      });
    } else {
      // If not logged in, proceed immediately
      this.checkStaffPermissions();
      this.loadSettings();
    }
  }

  checkStaffPermissions(): void {
    console.log(this.accountsService.is_staff)
    this.isStaff = this.accountsService.is_staff;
  }

  loadSettings(): void {
    this.loading = true;
    this.siteSettingsService.getCurrentSettings().subscribe({
      next: (settings) => {
        console.log(settings);
        this.settings = settings;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading site settings:', error);
        this.toastService.show('Site Settings','Failed to load site settings');
        this.loading = false;
      }
    });
  }

  onSettingsUpdated(updatedSettings: SiteSettings): void {
    this.settings = updatedSettings;
    this.toastService.show('Site Settings','Site settings updated successfully');

    // Apply theme changes immediately
    const publicSettings = this.siteSettingsService.getCurrentPublicSettings();
    if (publicSettings) {
      this.siteSettingsService.applyThemeColors(publicSettings);
      this.siteSettingsService.updatePageBranding(publicSettings);
    }
  }

  openPreviewModal(): void {
    // Open a modal to preview the current settings
    const modalRef = this.modalService.open(SitePreviewModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.settings = this.settings;
  }

  resetBannerDismissal(): void {
    this.siteSettingsService.resetBannerDismissal();
    this.toastService.show('Site Settings','Banner dismissal reset - banner will show again');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}

// Preview Modal Component (inline for simplicity)
@Component({
  selector: 'app-site-preview-modal',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Site Settings Preview</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="preview-container">
        <!-- Navbar Preview -->
        <div class="preview-section">
          <h6>Navigation Bar Preview</h6>
          <nav class="navbar navbar-expand-lg bg-body-tertiary shadow-sm mb-3"
               [style.border-left]="'4px solid ' + (settings?.primary_color || '#0066cc')">
            <div class="container-fluid">
              <a class="navbar-brand" href="#">{{ settings?.site_name || 'CUPCAKE' }}</a>
              @if (settings?.site_tagline) {
                <small class="text-muted ms-2">{{ settings?.site_tagline }}</small>
              }
            </div>
          </nav>
        </div>

        <!-- Banner Preview -->
        @if (settings?.banner_enabled && settings?.banner_text) {
          <div class="preview-section">
            <h6>Banner Preview</h6>
            <div class="alert mb-3"
                 [style.background-color]="settings?.banner_color"
                 [style.color]="settings?.banner_text_color"
                 [style.border-color]="settings?.banner_color">
              <div class="d-flex justify-content-between align-items-center">
                <span>{{ settings?.banner_text }}</span>
                @if (settings?.banner_dismissible) {
                  <button type="button" class="btn-close" aria-label="Close"></button>
                }
              </div>
            </div>
          </div>
        }

        <!-- Theme Colors Preview -->
        <div class="preview-section">
          <h6>Theme Colors Preview</h6>
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-2">
                <div class="card-header text-white"
                     [style.background-color]="settings?.primary_color || '#0066cc'">
                  Primary Color
                </div>
                <div class="card-body">
                  <button class="btn me-2"
                          [style.background-color]="settings?.primary_color || '#0066cc'"
                          [style.border-color]="settings?.primary_color || '#0066cc'"
                          style="color: white;">
                    Primary Button
                  </button>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card mb-2">
                <div class="card-header text-white"
                     [style.background-color]="settings?.secondary_color || '#6c757d'">
                  Secondary Color
                </div>
                <div class="card-body">
                  <button class="btn"
                          [style.background-color]="settings?.secondary_color || '#6c757d'"
                          [style.border-color]="settings?.secondary_color || '#6c757d'"
                          style="color: white;">
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Preview -->
        @if (settings?.footer_text) {
          <div class="preview-section">
            <h6>Footer Preview</h6>
            <footer class="footer mt-auto py-3 bg-light">
              <div class="container text-center">
                <span class="text-muted">{{ settings?.footer_text }}</span>
              </div>
            </footer>
          </div>
        }
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.close()">Close</button>
    </div>
  `,
  styles: [`
    .preview-container {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.375rem;
    }
    .preview-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 0.375rem;
      border: 1px solid #dee2e6;
    }
    .preview-section h6 {
      margin-bottom: 0.75rem;
      color: #495057;
      font-weight: 600;
    }
  `]
})
export class SitePreviewModalComponent {
  settings: SiteSettings | null = null;

  constructor(public activeModal: NgbActiveModal) {}
}
