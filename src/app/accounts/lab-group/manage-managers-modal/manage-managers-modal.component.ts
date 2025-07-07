import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { WebService } from '../../../web.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';
import { LabGroup, LabGroupManager } from '../../../lab-group';
import { User, UserQuery } from '../../../user';
import { ToastService } from '../../../toast.service';
import { AccountsService } from '../../accounts.service';

@Component({
  selector: 'app-manage-managers-modal',
  imports: [
    ReactiveFormsModule,
    NgbPagination,
    NgbTooltip
  ],
  templateUrl: './manage-managers-modal.component.html',
  styleUrl: './manage-managers-modal.component.scss'
})
export class ManageManagersModalComponent {
  isLoading = false;
  isActionPending = false;

  userQuery: UserQuery | undefined;
  managers: LabGroupManager[] = [];
  private _labGroup: LabGroup | undefined;

  @Input() set labGroup(value: LabGroup | undefined) {
    this._labGroup = value;
    if (value) {
      this.loadManagers();
      this.getUsers(undefined);
    }
  }

  get labGroup(): LabGroup | undefined {
    return this._labGroup;
  }

  form = this.fb.group({
    name: [""]
  });

  userPage: number = 1;
  managersMap: { [key: string]: boolean } = {};

  constructor(
    private modal: NgbActiveModal,
    private web: WebService,
    private fb: FormBuilder,
    private toastService: ToastService,
    public accountsService: AccountsService
  ) {
    this.form.controls.name.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string | null) => {
        if (!this.labGroup) {
          return of(undefined);
        }
        this.isLoading = true;
        return this.web.getUsers(undefined, 10, 0, term || undefined).pipe(
          map((users) => {
            this.isLoading = false;
            return users;
          }),
          catchError(() => {
            this.isLoading = false;
            return of(undefined);
          })
        );
      })
    ).subscribe((users) => {
      this.userQuery = users;
      this.updateManagersMap();
    });
  }

  close() {
    this.modal.close();
  }

  loadManagers() {
    if (this.labGroup) {
      this.web.getLabGroupManagers(this.labGroup.id).subscribe({
        next: (managers) => {
          this.managers = managers;
          this.updateManagersMap();
        },
        error: (error) => {
          console.error('Error loading managers:', error);
          this.toastService.show('Error loading managers', 'error');
        }
      });
    }
  }

  updateManagersMap() {
    this.managersMap = {};
    if (this.userQuery) {
      for (const user of this.userQuery.results) {
        this.managersMap[user.id] = this.managers.some(manager => manager.id === user.id);
      }
    }
  }

  getUsers(searchTerm: string | undefined | null) {
    this.web.getUsers(undefined, 10, (this.userPage - 1) * 10, searchTerm).subscribe((users) => {
      this.userQuery = users;
      this.updateManagersMap();
    });
  }

  handleUserPageChange(page: number) {
    this.userPage = page;
    if (this.form.controls.name.value) {
      this.getUsers(this.form.controls.name.value);
    } else {
      this.getUsers(undefined);
    }
  }

  addManager(user: User) {
    if (this.labGroup) {
      this.isActionPending = true;
      this.web.addLabGroupManager(this.labGroup.id, user.id).subscribe({
        next: (updatedLabGroup) => {
          this.toastService.show(`${user.username} added as manager`, 'success');
          this.loadManagers();
          this.getUsers(this.form.value.name);
          this.isActionPending = false;
        },
        error: (error) => {
          console.error('Error adding manager:', error);
          const errorMessage = error.error?.error || 'Failed to add manager';
          this.toastService.show(errorMessage, 'error');
          this.isActionPending = false;
        }
      });
    }
  }

  removeManager(user: User | LabGroupManager) {
    if (this.labGroup) {
      // Check if this would remove the last manager
      if (this.managers.length <= 1 && !this.accountsService.is_staff) {
        this.toastService.show('Cannot remove the last manager. At least one manager must remain.', 'error');
        return;
      }

      this.isActionPending = true;
      this.web.removeLabGroupManager(this.labGroup.id, user.id).subscribe({
        next: (updatedLabGroup) => {
          this.toastService.show(`${user.username} removed as manager`, 'success');
          this.loadManagers();
          this.getUsers(this.form.value.name);
          this.isActionPending = false;
        },
        error: (error) => {
          console.error('Error removing manager:', error);
          const errorMessage = error.error?.error || 'Failed to remove manager';
          this.toastService.show(errorMessage, 'error');
          this.isActionPending = false;
        }
      });
    }
  }

  canManageManagers(): boolean {
    // Staff can always manage managers
    if (this.accountsService.is_staff) {
      return true;
    }

    // Check if current user is a manager of this lab group
    const currentUserId = this.accountsService.getCurrentUserId();
    return this.managers.some(manager => manager.id === currentUserId);
  }

  getDisplayName(user: User): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  }

  getManagerDisplayName(manager: LabGroupManager): string {
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.username;
  }
}