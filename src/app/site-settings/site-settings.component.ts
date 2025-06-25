import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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

  @ViewChild(SiteSettingsFormComponent) siteSettingsForm!: SiteSettingsFormComponent;

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
    // Get current form values for preview
    const currentFormValues = this.siteSettingsForm?.settingsForm?.value;

    // Merge saved settings with current form values for preview
    const previewSettings: SiteSettings = {
      ...this.settings,
      ...currentFormValues
    } as SiteSettings;

    const modalRef = this.modalService.open(SitePreviewModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.settings = previewSettings;
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
          <nav class="navbar navbar-expand-lg bg-body-tertiary shadow-sm mb-3 border-start border-primary border-4">
            <div class="container-fluid">
              <a class="navbar-brand text-primary fw-bold" href="#">{{ settings?.site_name || 'CUPCAKE' }}</a>
              @if (settings?.site_tagline) {
                <small class="text-muted ms-2">{{ settings?.site_tagline }}</small>
              }
              <div class="navbar-nav ms-auto">
                <a class="nav-link link-primary" href="#">Sample Link</a>
                <button class="btn btn-primary btn-sm">Login</button>
              </div>
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
                <div class="card-header bg-primary text-white">
                  Primary Color
                </div>
                <div class="card-body">
                  <button class="btn btn-primary me-2">
                    Primary Button
                  </button>
                  <button class="btn btn-outline-primary">
                    Outline Primary
                  </button>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card mb-2">
                <div class="card-header bg-secondary text-white">
                  Secondary Color
                </div>
                <div class="card-body">
                  <button class="btn btn-secondary me-2">
                    Secondary Button
                  </button>
                  <button class="btn btn-outline-secondary">
                    Outline Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Bootstrap components preview -->
          <div class="row mt-3">
            <div class="col-md-6">
              <div class="alert alert-primary" role="alert">
                <strong>Primary Alert:</strong> This is how primary alerts will look.
              </div>
              <span class="badge bg-primary">Primary Badge</span>
              <a href="#" class="link-primary ms-2">Primary Link</a>
            </div>
            <div class="col-md-6">
              <div class="alert alert-secondary" role="alert">
                <strong>Secondary Alert:</strong> This is how secondary alerts will look.
              </div>
              <span class="badge bg-secondary">Secondary Badge</span>
              <a href="#" class="link-secondary ms-2">Secondary Link</a>
            </div>
          </div>
        </div>

        <!-- Footer Preview -->
        @if (settings?.footer_text) {
          <div class="preview-section">
            <h6>Footer Preview</h6>
            <footer class="footer mt-auto py-3 bg-body-secondary border-top">
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
      padding: 1rem;
      border-radius: 0.375rem;
    }
    .preview-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--bs-body-bg);
      border-radius: 0.375rem;
      border: 1px solid var(--bs-border-color);
    }
    .preview-section h6 {
      margin-bottom: 0.75rem;
      color: var(--bs-body-color);
      font-weight: 600;
    }

    [data-bs-theme="dark"] .preview-container {
      background: var(--bs-gray-800);
    }
  `]
})
export class SitePreviewModalComponent implements OnInit, OnDestroy {
  settings: SiteSettings | null = null;
  private originalColors: { [key: string]: string } = {};

  constructor(
    public activeModal: NgbActiveModal,
    private siteSettingsService: SiteSettingsService
  ) {}

  ngOnInit(): void {
    if (this.settings) {
      // Store original colors from CSS variables
      this.storeOriginalColors();
      
      // Apply preview colors temporarily
      this.applyPreviewColors();
    }
  }

  ngOnDestroy(): void {
    // Restore original colors when modal closes
    this.restoreOriginalColors();
  }

  private storeOriginalColors(): void {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Store all Bootstrap color variables we might modify
    const colorVars = [
      '--bs-primary', '--bs-primary-rgb',
      '--bs-secondary', '--bs-secondary-rgb'
    ];
    
    colorVars.forEach(varName => {
      this.originalColors[varName] = computedStyle.getPropertyValue(varName).trim();
    });
  }

  private applyPreviewColors(): void {
    if (this.settings) {
      const root = document.documentElement;
      
      // Apply primary color
      if (this.settings.primary_color) {
        root.style.setProperty('--bs-primary', this.settings.primary_color);
        const primaryRgb = this.hexToRgb(this.settings.primary_color);
        if (primaryRgb) {
          root.style.setProperty('--bs-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        }
      }
      
      // Apply secondary color
      if (this.settings.secondary_color) {
        root.style.setProperty('--bs-secondary', this.settings.secondary_color);
        const secondaryRgb = this.hexToRgb(this.settings.secondary_color);
        if (secondaryRgb) {
          root.style.setProperty('--bs-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
        }
      }
    }
  }

  private restoreOriginalColors(): void {
    const root = document.documentElement;
    Object.entries(this.originalColors).forEach(([varName, value]) => {
      if (value) {
        root.style.setProperty(varName, value);
      } else {
        root.style.removeProperty(varName);
      }
    });
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
