import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { UserDashboardComponent } from './user-dashboard.component';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';

describe('UserDashboardComponent', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;
  let mockWebService: jasmine.SpyObj<WebService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAccountsService: jasmine.SpyObj<AccountsService>;

  const mockDashboardData = {
    user_info: {
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@example.com',
      is_staff: false
    },
    quick_stats: {
      total_protocols: 10,
      total_sessions: 5,
      total_annotations: 20,
      lab_groups_count: 2
    },
    recent_activity: {
      protocols: [],
      sessions: [],
      annotations: []
    },
    lab_groups: []
  };

  const mockActivitySummary = {
    total_counts: {
      protocols: 10,
      sessions: 5,
      annotations: 20,
      projects: 2,
      stored_reagents: 15
    },
    recent_activity: {
      protocols_last_30_days: 3,
      sessions_last_30_days: 2,
      annotations_last_30_days: 8
    },
    lab_groups: {
      member_of: 2,
      managing: 1
    }
  };

  beforeEach(async () => {
    const webServiceSpy = jasmine.createSpyObj('WebService', [
      'getUserDashboardData',
      'getUserActivitySummary'
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['show']);
    const accountsServiceSpy = jasmine.createSpyObj('AccountsService', ['getCurrentUser'], {
      loggedIn: true,
      username: 'testuser'
    });

    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent, HttpClientTestingModule],
      providers: [
        { provide: WebService, useValue: webServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: AccountsService, useValue: accountsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
    mockWebService = TestBed.inject(WebService) as jasmine.SpyObj<WebService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockAccountsService = TestBed.inject(AccountsService) as jasmine.SpyObj<AccountsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    mockWebService.getUserDashboardData.and.returnValue(of(mockDashboardData));
    mockWebService.getUserActivitySummary.and.returnValue(of(mockActivitySummary));

    component.ngOnInit();

    expect(mockWebService.getUserDashboardData).toHaveBeenCalled();
    expect(mockWebService.getUserActivitySummary).toHaveBeenCalled();
    expect(component.dashboardData).toEqual(mockDashboardData);
    expect(component.activitySummary).toEqual(mockActivitySummary);
  });

  it('should handle dashboard data loading error', () => {
    mockWebService.getUserDashboardData.and.returnValue(throwError('Error loading dashboard'));
    mockWebService.getUserActivitySummary.and.returnValue(of(mockActivitySummary));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load dashboard data');
    expect(component.loading).toBe(false);
    expect(mockToastService.show).toHaveBeenCalledWith('Dashboard', 'Failed to load dashboard data');
  });

  it('should format date correctly', () => {
    const testDate = '2023-12-01T10:30:00Z';
    const formatted = component.formatDateTime(testDate);
    
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('Never');
  });

  it('should return correct greeting based on time', () => {
    const greeting = component.getGreeting();
    
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
  });

  it('should refresh dashboard data', () => {
    mockWebService.getUserDashboardData.and.returnValue(of(mockDashboardData));
    mockWebService.getUserActivitySummary.and.returnValue(of(mockActivitySummary));

    component.refreshDashboard();

    expect(mockWebService.getUserDashboardData).toHaveBeenCalled();
    expect(mockWebService.getUserActivitySummary).toHaveBeenCalled();
  });

  it('should set active tab correctly', () => {
    expect(component.activeTab).toBe('protocols');
    
    component.activeTab = 'sessions';
    expect(component.activeTab).toBe('sessions');
  });
});