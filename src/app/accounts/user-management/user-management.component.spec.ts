import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { UserManagementComponent } from './user-management.component';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let mockWebService: jasmine.SpyObj<WebService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAccountsService: jasmine.SpyObj<AccountsService>;

  const mockAnalytics = {
    users: {
      total: 100,
      active: 85,
      staff: 10,
      new_last_30_days: 5
    },
    resources: {
      protocols: 150,
      sessions: 200,
      annotations: 300,
      projects: 25,
      lab_groups: 8
    },
    recent_activity: {
      protocols_last_30_days: 15,
      sessions_last_30_days: 25,
      annotations_last_30_days: 40
    },
    top_active_users: [
      {
        id: 1,
        username: 'user1',
        total_activity: 50,
        protocols: 10,
        sessions: 20,
        annotations: 20
      }
    ]
  };

  const mockUsers = [
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_staff: false,
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const webServiceSpy = jasmine.createSpyObj('WebService', [
      'getPlatformAnalytics',
      'searchUsers',
      'deactivateUser',
      'reactivateUser'
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['show']);
    const accountsServiceSpy = jasmine.createSpyObj('AccountsService', ['getCurrentUser'], {
      loggedIn: true,
      username: 'admin',
      is_staff: true
    });

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: WebService, useValue: webServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: AccountsService, useValue: accountsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    mockWebService = TestBed.inject(WebService) as jasmine.SpyObj<WebService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockAccountsService = TestBed.inject(AccountsService) as jasmine.SpyObj<AccountsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load platform analytics on init for staff users', () => {
    mockWebService.getPlatformAnalytics.and.returnValue(of(mockAnalytics));
    mockWebService.searchUsers.and.returnValue(of({ results: mockUsers, count: 1, next: null, previous: null }));

    component.ngOnInit();

    expect(mockWebService.getPlatformAnalytics).toHaveBeenCalled();
    expect(mockWebService.searchUsers).toHaveBeenCalledWith({ active: true }, 10, 0);
    expect(component.analytics).toEqual(mockAnalytics);
  });

  it('should show access denied error for non-staff users', () => {
    Object.defineProperty(mockAccountsService, 'is_staff', { value: false });
    
    component.ngOnInit();

    expect(component.error).toBe('Access denied. Staff privileges required.');
    expect(mockWebService.getPlatformAnalytics).not.toHaveBeenCalled();
  });

  it('should handle error loading platform analytics', () => {
    mockWebService.getPlatformAnalytics.and.returnValue(throwError('Error loading analytics'));
    mockWebService.searchUsers.and.returnValue(of({ results: [], count: 0, next: null, previous: null }));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load platform analytics');
    expect(component.loading).toBe(false);
    expect(mockToastService.show).toHaveBeenCalledWith('Platform Analytics', 'Failed to load analytics');
  });

  it('should load recent users', () => {
    mockWebService.searchUsers.and.returnValue(of({ results: mockUsers, count: 1, next: null, previous: null }));

    component.loadRecentUsers();

    expect(mockWebService.searchUsers).toHaveBeenCalledWith({ active: true }, 10, 0);
    expect(component.recentUsers).toEqual(mockUsers);
  });

  it('should open deactivate modal', () => {
    component.openDeactivateModal(1);

    expect(component.selectedUserId).toBe(1);
    expect(component.showDeactivateModal).toBe(true);
    expect(component.deactivationReason).toBe('');
  });

  it('should close modals', () => {
    component.selectedUserId = 1;
    component.showDeactivateModal = true;
    component.deactivationReason = 'test reason';

    component.closeModals();

    expect(component.selectedUserId).toBeNull();
    expect(component.showDeactivateModal).toBe(false);
    expect(component.deactivationReason).toBe('');
  });

  it('should deactivate user', () => {
    component.selectedUserId = 1;
    component.deactivationReason = 'test reason';
    mockWebService.deactivateUser.and.returnValue(of({ message: 'User deactivated' }));
    mockWebService.searchUsers.and.returnValue(of({ results: [], count: 0, next: null, previous: null }));

    component.confirmDeactivateUser();

    expect(mockWebService.deactivateUser).toHaveBeenCalledWith(1, 'test reason');
    expect(mockToastService.show).toHaveBeenCalledWith('User Management', 'User deactivated');
  });

  it('should reactivate user', () => {
    component.selectedUserId = 1;
    mockWebService.reactivateUser.and.returnValue(of({ message: 'User reactivated' }));
    mockWebService.searchUsers.and.returnValue(of({ results: [], count: 0, next: null, previous: null }));

    component.confirmReactivateUser();

    expect(mockWebService.reactivateUser).toHaveBeenCalledWith(1);
    expect(mockToastService.show).toHaveBeenCalledWith('User Management', 'User reactivated');
  });

  it('should get user full name', () => {
    const user = {
      id: 1,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      is_staff: false,
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z'
    };

    const fullName = component.getUserFullName(user);

    expect(fullName).toBe('Test User');
  });

  it('should return username if no first/last name', () => {
    const user = {
      id: 1,
      username: 'testuser',
      first_name: '',
      last_name: '',
      email: 'test@example.com',
      is_staff: false,
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z'
    };

    const fullName = component.getUserFullName(user);

    expect(fullName).toBe('testuser');
  });

  it('should calculate activity growth', () => {
    const growth = component.getActivityGrowth(10, 100);
    expect(growth).toBe(10);
  });

  it('should return 0 for activity growth when total is 0', () => {
    const growth = component.getActivityGrowth(5, 0);
    expect(growth).toBe(0);
  });

  it('should refresh data', () => {
    mockWebService.getPlatformAnalytics.and.returnValue(of(mockAnalytics));
    mockWebService.searchUsers.and.returnValue(of({ results: mockUsers, count: 1, next: null, previous: null }));

    component.refreshData();

    expect(mockWebService.getPlatformAnalytics).toHaveBeenCalled();
    expect(mockWebService.searchUsers).toHaveBeenCalledWith({ active: true }, 10, 0);
  });
});