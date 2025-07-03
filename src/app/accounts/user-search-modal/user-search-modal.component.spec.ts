import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { UserSearchModalComponent } from './user-search-modal.component';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';
import { User } from '../../user';

describe('UserSearchModalComponent', () => {
  let component: UserSearchModalComponent;
  let fixture: ComponentFixture<UserSearchModalComponent>;
  let mockActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let mockWebService: jasmine.SpyObj<WebService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAccountsService: jasmine.SpyObj<AccountsService>;

  const mockUsers: User[] = [
    {
      id: 1,
      username: 'testuser1',
      first_name: 'Test',
      last_name: 'User',
      email: 'test1@example.com',
      is_staff: false,
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z',
      lab_groups: [
        {
          id: 1,
          name: 'Lab Group 1',
          description: 'Test Lab Group',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          default_storage: null,
          is_professional: false,
          service_storage: null
        }
      ]
    },
    {
      id: 2,
      username: 'staffuser',
      first_name: 'Staff',
      last_name: 'User',
      email: 'staff@example.com',
      is_staff: true,
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z',
      lab_groups: []
    }
  ];

  beforeEach(async () => {
    const activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    const webServiceSpy = jasmine.createSpyObj('WebService', ['searchUsers', 'getLabGroups']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['show']);
    const accountsServiceSpy = jasmine.createSpyObj('AccountsService', [], {
      username: 'testuser1',
      is_staff: false
    });

    await TestBed.configureTestingModule({
      imports: [UserSearchModalComponent],
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy },
        { provide: WebService, useValue: webServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: AccountsService, useValue: accountsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserSearchModalComponent);
    component = fixture.componentInstance;
    mockActiveModal = TestBed.inject(NgbActiveModal) as jasmine.SpyObj<NgbActiveModal>;
    mockWebService = TestBed.inject(WebService) as jasmine.SpyObj<WebService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockAccountsService = TestBed.inject(AccountsService) as jasmine.SpyObj<AccountsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.searchQuery).toBe('');
    expect(component.selectedRole).toBe('');
    expect(component.activeOnly).toBe(true);
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(10);
  });

  it('should search users on init', () => {
    const mockResponse = {
      results: mockUsers,
      count: 2,
      next: null,
      previous: null
    };
    const mockLabGroupResponse = {
      results: [],
      count: 0,
      next: null,
      previous: null
    };
    mockWebService.searchUsers.and.returnValue(of(mockResponse));
    mockWebService.getLabGroups.and.returnValue(of(mockLabGroupResponse));

    component.ngOnInit();

    expect(mockWebService.searchUsers).toHaveBeenCalled();
    expect(mockWebService.getLabGroups).toHaveBeenCalled();
    expect(component.users).toEqual(mockUsers);
    expect(component.totalCount).toBe(2);
  });

  it('should handle search query change', () => {
    const mockResponse = {
      results: mockUsers,
      count: 2,
      next: null,
      previous: null
    };
    mockWebService.searchUsers.and.returnValue(of(mockResponse));

    component.searchQuery = 'test';
    component.onSearchChange();

    setTimeout(() => {
      expect(component.currentPage).toBe(1);
      expect(mockWebService.searchUsers).toHaveBeenCalled();
    }, 350);
  });

  it('should handle filter change', () => {
    const mockResponse = {
      results: mockUsers,
      count: 2,
      next: null,
      previous: null
    };
    mockWebService.searchUsers.and.returnValue(of(mockResponse));

    component.selectedRole = 'staff';
    component.onFilterChange();

    expect(component.currentPage).toBe(1);
    expect(mockWebService.searchUsers).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    const mockResponse = {
      results: mockUsers,
      count: 2,
      next: null,
      previous: null
    };
    mockWebService.searchUsers.and.returnValue(of(mockResponse));

    component.searchQuery = 'test';
    component.selectedRole = 'staff';
    component.activeOnly = false;
    component.currentPage = 2;

    component.clearFilters();

    expect(component.searchQuery).toBe('');
    expect(component.selectedRole).toBe('');
    expect(component.activeOnly).toBe(true);
    expect(component.currentPage).toBe(1);
    expect(mockWebService.searchUsers).toHaveBeenCalled();
  });

  it('should get user full name', () => {
    const user = mockUsers[0];
    const fullName = component.getUserFullName(user);
    expect(fullName).toBe('Test User');
  });

  it('should get username when no first/last name', () => {
    const user = { ...mockUsers[0], first_name: '', last_name: '' };
    const fullName = component.getUserFullName(user);
    expect(fullName).toBe('testuser1');
  });

  it('should select user and close modal', () => {
    const user = mockUsers[0];
    component.selectUser(user);
    expect(mockActiveModal.close).toHaveBeenCalledWith(user);
  });

  it('should identify current user', () => {
    const isCurrentUser = component.isCurrentUser(mockUsers[0]);
    expect(isCurrentUser).toBe(true);
  });

  it('should handle pagination', () => {
    const mockResponse = {
      results: mockUsers,
      count: 20,
      next: 'next-url',
      previous: null
    };
    mockWebService.searchUsers.and.returnValue(of(mockResponse));

    component.hasNext = true;
    component.nextPage();

    expect(component.currentPage).toBe(2);
    expect(mockWebService.searchUsers).toHaveBeenCalled();
  });

  it('should calculate total pages', () => {
    component.totalCount = 25;
    component.pageSize = 10;
    const totalPages = component.getTotalPages();
    expect(totalPages).toBe(3);
  });

  it('should close modal', () => {
    component.close();
    expect(mockActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should handle search error', () => {
    const error = new Error('Search failed');
    mockWebService.searchUsers.and.returnValue(of().pipe(() => {
      throw error;
    }));

    component.searchUsers();

    expect(mockToastService.show).toHaveBeenCalledWith('User Search', 'Failed to search users');
    expect(component.loading).toBe(false);
  });
});
