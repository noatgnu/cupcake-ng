import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {WebService} from "../web.service";
import {DataService} from "../data.service";
import {Router} from "@angular/router";
import {DatePipe, NgOptimizedImage} from "@angular/common";
import {Protocol, ProtocolQuery} from "../protocol";
import {ToastService} from "../toast.service";
import {AccountsService} from "../accounts/accounts.service";
import {ProtocolSession, ProtocolSessionQuery} from "../protocol-session";
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet,
  NgbPagination,
} from "@ng-bootstrap/ng-bootstrap";
import {ProtocolListComponent} from "../protocol-list/protocol-list.component";
import {Project, ProjectQuery} from "../project";
import {SiteSettingsService} from "../site-settings.service";
import {environment} from "../../environments/environment";

@Component({
    selector: 'app-laboratory-notebook',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNavOutlet,
    ProtocolListComponent,
    NgbPagination,
    FormsModule
  ],
    templateUrl: './laboratory-notebook.component.html',
    styleUrl: './laboratory-notebook.component.scss'
})
export class LaboratoryNotebookComponent implements OnInit, AfterViewInit {
  @ViewChild('logo') logo?: ElementRef;
  currentProtocolPage = 1;
  form = this.fb.group({
    url: new FormControl('', Validators.required),
  })
  currentSessionPage = 1;
  currentProjectPage = 1;
  currentProjectID = 0;
  protocolQuery?: ProtocolQuery;
  currentProtocolQueryOffset = 0;
  pageSize = 5;
  loadingProtocol = false;
  loadingSession = false;
  loadingProject = false;
  protocolSessionQuery?: ProtocolSessionQuery;
  projectQuery?: ProjectQuery;
  currentProtocolSessionQueryOffset = 0;
  currentProjectQueryOffset = 0;
  associatedSessionProtocols: Protocol[] = [];
  currentSessionID: string = '';
  active = 'protocols'
  rating = 0;
  searchTerm = '';
  hasLogo = false;
  baseUrl = environment.baseURL;
  logoUrl: string | null = null;
  includeVaultedProtocols: boolean = false;
  includeVaultedProjects: boolean = false;
  includeVaultedSessions: boolean = false;
  includeSharedProtocols: boolean = false;
  includeSharedSessions: boolean = false;
  vaultedOnlyProtocols: boolean = false;
  vaultedOnlySessions: boolean = false;


  constructor(public accounts: AccountsService, private router: Router, private fb: FormBuilder, private web: WebService, private dataService: DataService, private toastService: ToastService, public siteSettings: SiteSettingsService) {
    this.siteSettings.publicSettings$.subscribe((data) => {
      console.log(data)
      if (data) {
        if (data.logo) {
          this.hasLogo = true;
          this.logoUrl = `${this.baseUrl}/api/site_settings/download_logo/`;
          console.log('Logo URL set to:', this.logoUrl);
        }
      }
    })

    this.dataService.triggerReload.subscribe((data) => {
      this.currentSessionPage = 1;
      this.currentProtocolPage = 1;
      this.currentProtocolQueryOffset = 0;
      this.currentProtocolSessionQueryOffset = 0;
      this.currentProjectQueryOffset = 0;
      if (this.accounts.loggedIn) {
        if (!data) {
          if (this.active === 'protocols') {
            this.getUserProtocols(undefined, this.pageSize, this.currentProtocolQueryOffset)
          } else if (this.active === 'sessions') {
            this.getUserSessions(undefined, this.pageSize, this.currentProtocolSessionQueryOffset)
          } else {
            this.getProjects(undefined, this.pageSize, this.currentProjectQueryOffset)
          }
        } else {
          this.getUserProtocols()
          this.getUserSessions()
          this.getProjects()
        }
      }
      this.web.getStaffStatus().subscribe((data) => {
        this.accounts.is_staff = data.is_staff
        console.log(data.is_staff)
      })
    })

  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    if (this.accounts.loggedIn) {
      this.getUserProtocols()
      this.getUserSessions()
      this.getProjects()

    } else {
      this.toastService.show("Login", "Please login to access your protocols")
      this.accounts.triggerLoginSubject.next(true)
    }

  }

  onSubmit() {
    if (this.form.valid) {
      if (this.form.value.url) {
        this.toastService.show("Protocol", "Creating protocol...")
        this.web.postProtocol(this.form.value.url).subscribe(
          (response) => {
            this.toastService.show("Protocol", "Protocol created successfully")
            this.dataService.protocol = response;
            localStorage.setItem('protocol', JSON.stringify(response));
          },
          (error) => {
            this.toastService.show("Protocol", "Error creating protocol")
            console.log(error);
          }, () => {
            if (this.dataService.protocol)
            this.router.navigate([`/protocol-session/${this.dataService.protocol.id}`])
          }
        )
      }
    }
  }

  navigateToEditor() {
    window.open(location.origin + "/#/protocol-editor", '_blank')
  }

  getUserProtocols(url?: string, limit: number = 5, offset: number = 0) {
    this.loadingProtocol = true;
    this.toastService.show("Protocol", "Fetching user's protocols...")
    this.web.getUserProtocols(url, limit, offset, this.searchTerm, this.includeVaultedProtocols, this.includeSharedProtocols, this.vaultedOnlyProtocols).subscribe((response) => {
      this.protocolQuery = response;
      this.loadingProtocol = false;
      this.toastService.show("Protocol", "Protocols fetched successfully")
    }, (error) => {
      console.log(error);
      this.loadingProtocol = false;
      this.toastService.show("Protocol", "Error fetching protocols")
    });
  }

  getUserSessions(url?: string, limit: number = 5, offset: number = 0) {
    this.loadingSession = true;
    this.toastService.show("Protocol", "Fetching user's sessions...")
    this.web.getUserSessions(url, limit, offset, this.searchTerm, this.includeVaultedSessions, this.includeSharedSessions, this.vaultedOnlySessions).subscribe((response) => {
      this.protocolSessionQuery = response;
      this.loadingSession = false;
      this.toastService.show("Protocol", "Sessions fetched successfully")
    }, (error) => {
      console.log(error);
      this.loadingSession = false;
      this.toastService.show("Protocol", "Error fetching sessions")
    });
  }

  getAssociatedProtocolTitle(sessionID: string) {
    this.currentSessionID = sessionID;
    this.web.getAssociatedProtocolTitles(sessionID).subscribe((response) => {
      this.associatedSessionProtocols = response;
    })
  }

  deleteProtocol(id: number) {
    this.web.deleteProtocol(id).subscribe(() => {
      this.getUserProtocols(undefined, this.pageSize, this.currentProtocolQueryOffset)
    })
  }

  handlePageChange(event: number) {
    if (this.active === 'protocols') {
      const offset = (event - 1) * this.pageSize;
      this.currentProtocolQueryOffset = offset;
      this.getUserProtocols(undefined, this.pageSize, offset);
    } else if (this.active === 'sessions') {
      const offset = (event - 1) * this.pageSize;
      this.currentProtocolSessionQueryOffset = offset;
      this.getUserSessions(undefined, this.pageSize, offset);
    } else {
      const offset = (event - 1) * this.pageSize;
      this.currentProjectQueryOffset = offset;
      this.getProjects(undefined, this.pageSize, offset);
    }
  }

  navigateToEditProtocol(id: number) {
    window.open(location.origin + "/#/protocol-editor/" + id, '_blank')
  }

  search() {
    this.getUserProtocols()
    this.getUserSessions()
    this.getProjects()
  }

  getProjects(url?: string, limit: number = 5, offset: number = 0) {
    this.loadingProject = true;
    this.toastService.show("Project", "Fetching user's projects...")
    this.web.getProjects(url, limit, offset, this.searchTerm, this.includeVaultedProjects).subscribe((response) => {
      this.projectQuery = response;
      this.loadingProject = false;
      this.toastService.show("Project", "Projects fetched successfully")
    }, (error) => {
      console.log(error);
      this.loadingProject = false;
      this.toastService.show("Project", "Error fetching projects")
    })
  }

  nextProjectPage() {
    if (this.projectQuery?.next) {
      this.getProjects(this.projectQuery.next)
    }
  }

  previousProjectPage() {
    if (this.projectQuery?.previous) {
      this.getProjects(this.projectQuery.previous)
    }
  }

  clickProject(project: Project) {
    if (this.currentProjectID === project.id) {
      this.currentProjectID = 0;
      return;
    }
    this.currentProjectID = project.id;
  }

  onImageError(event: any) {
    console.error('Logo failed to load:', event);
    console.log('Failed URL:', this.logoUrl);
    // Try with a cache-busting parameter
    if (this.logoUrl && !this.logoUrl.includes('?')) {
      this.logoUrl = `${this.logoUrl}?t=${Date.now()}`;
      console.log('Retrying with cache-busting URL:', this.logoUrl);
    } else {
      // If it still fails, hide the logo
      this.hasLogo = false;
      this.logoUrl = null;
    }
  }

  onImageLoad(event: any) {
    console.log('Logo loaded successfully:', event);
  }

  toggleVaultedProtocols() {
    // Refresh the protocols view with the new vaulted setting
    this.currentProtocolPage = 1;
    this.currentProtocolQueryOffset = 0;
    this.getUserProtocols(undefined, this.pageSize, this.currentProtocolQueryOffset);
  }

  toggleVaultedProjects() {
    // Refresh the projects view with the new vaulted setting
    this.currentProjectPage = 1;
    this.currentProjectQueryOffset = 0;
    this.getProjects(undefined, this.pageSize, this.currentProjectQueryOffset);
  }

  toggleVaultedSessions() {
    // Refresh the sessions view with the new vaulted setting
    this.currentSessionPage = 1;
    this.currentProtocolSessionQueryOffset = 0;
    this.getUserSessions(undefined, this.pageSize, this.currentProtocolSessionQueryOffset);
  }

  toggleSharedProtocols() {
    // Refresh the protocols view with the new shared setting
    this.currentProtocolPage = 1;
    this.currentProtocolQueryOffset = 0;
    this.getUserProtocols(undefined, this.pageSize, this.currentProtocolQueryOffset);
  }

  toggleSharedSessions() {
    // Refresh the sessions view with the new shared setting
    this.currentSessionPage = 1;
    this.currentProtocolSessionQueryOffset = 0;
    this.getUserSessions(undefined, this.pageSize, this.currentProtocolSessionQueryOffset);
  }

  toggleVaultedOnlyProtocols() {
    // Refresh the protocols view with the new vaulted-only setting
    this.currentProtocolPage = 1;
    this.currentProtocolQueryOffset = 0;
    this.getUserProtocols(undefined, this.pageSize, this.currentProtocolQueryOffset);
  }

  toggleVaultedOnlySessions() {
    // Refresh the sessions view with the new vaulted-only setting
    this.currentSessionPage = 1;
    this.currentProtocolSessionQueryOffset = 0;
    this.getUserSessions(undefined, this.pageSize, this.currentProtocolSessionQueryOffset);
  }

  isSessionVaulted(session: ProtocolSession): boolean {
    // Check if any of the session's protocol objects are vaulted
    return session.protocol_objects?.some(protocol => protocol.is_vaulted) || false;
  }

  isSessionSharedWithUser(session: ProtocolSession): boolean {
    const currentUserId = this.accounts.getCurrentUserId();
    if (!currentUserId || !session.user || session.user.id === currentUserId) {
      return false;
    }
    
    // Check if any of the session's protocol objects are shared with the current user
    return session.protocol_objects?.some(protocol => {
      const isViewer = protocol.viewers?.some((viewer: {id: number, username: string}) => viewer.id === currentUserId) || false;
      const isEditor = protocol.editors?.some((editor: {id: number, username: string}) => editor.id === currentUserId) || false;
      return isViewer || isEditor;
    }) || false;
  }

  isProjectSharedWithUser(project: Project): boolean {
    const currentUserId = this.accounts.getCurrentUserId();
    if (!currentUserId || !project.user || project.user.id === currentUserId) {
      return false;
    }
    
    // Check if current user is in project viewers or editors list
    const isViewer = project.viewers?.some((viewer: {id: number, username: string}) => viewer.id === currentUserId) || false;
    const isEditor = project.editors?.some((editor: {id: number, username: string}) => editor.id === currentUserId) || false;
    
    return isViewer || isEditor;
  }
}
