import {AfterViewInit, Component, Input} from '@angular/core';
import {NgbActiveModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, FormGroup, Validators} from "@angular/forms";
import {LabGroup, LabGroupQuery} from "../lab-group";
import {WebService} from "../web.service";
import {FavouriteMetadataOption} from "../favourite-metadata-option";
import {forkJoin, catchError, finalize, of, switchMap, tap, Observable, BehaviorSubject, debounceTime} from "rxjs";

@Component({
  selector: 'app-add-favourite-modal',
  imports: [
    ReactiveFormsModule,
    NgbTooltip
  ],
  templateUrl: './add-favourite-modal.component.html',
  styleUrl: './add-favourite-modal.component.scss'
})
export class AddFavouriteModalComponent  {
  form!: FormGroup;

  selectedLabGroup: LabGroup | undefined = undefined;

  isLoading = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  labGroupQuery: LabGroupQuery | undefined = undefined;
  alreadyFavouritedLabGroups: LabGroup[] = [];
  labGroupFavouriteMap: Record<number, FavouriteMetadataOption> = {};
  userFavouriteOption: FavouriteMetadataOption | undefined = undefined;

  // Search trigger
  private searchTrigger = new BehaviorSubject<string>('');

  // Input properties with proper encapsulation
  @Input() name = '';
  @Input() type = '';
  @Input() value = '';

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private web: WebService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormListeners();
    this.checkExistingUserFavourite();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      display_name: [this.value, [Validators.required]],
      mode: [''],
      lab_group_search: ['']
    });
  }

  private setupFormListeners(): void {
    this.form.get('mode')?.valueChanges.pipe(
      tap(() => {
        this.errorMessage = null;
        this.selectedLabGroup = undefined;
        this.alreadyFavouritedLabGroups = [];
      }),
      switchMap(mode => {
        if (mode === 'service_lab_group' || mode === 'lab_group') {
          this.userFavouriteOption = undefined;
          this.isLoading = true;

          const isProfessional = mode === 'service_lab_group';
          return this.web.getUserLabGroups('', 10, 0, isProfessional).pipe(
            finalize(() => this.isLoading = false),
            catchError(err => {
              this.errorMessage = 'Failed to load lab groups. Please try again.';
              return of(null);
            })
          );
        } else {
          this.labGroupQuery = undefined;
          return this.checkExistingUserFavourite();
        }
      })
    ).subscribe(result => {
      if (result && 'results' in result) {
        this.labGroupQuery = result;
        this.checkLabGroupFavourites(result.results);
      }
    });

    this.form.get('lab_group_search')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(value => {
      this.searchTrigger.next(value || '');
    });

    this.searchTrigger.pipe(
      tap(() => this.isLoading = true),
      switchMap(searchTerm => {
        const isProfessional = this.form.value.mode === 'service_lab_group';
        return this.web.getUserLabGroups(searchTerm, 10, 0, isProfessional).pipe(
          finalize(() => this.isLoading = false),
          catchError(err => {
            this.errorMessage = 'Failed to search lab groups.';
            return of(null);
          })
        );
      })
    ).subscribe((result:any) => {
      if (result && 'results' in result) {
        this.labGroupQuery = result;
        this.checkLabGroupFavourites(result.results);
      }
    });
  }

  private checkExistingUserFavourite(): Observable<any> {
    this.isLoading = true;
    return this.web.getFavouriteMetadataOptions(1, 0, this.value, 'user', undefined, this.name).pipe(
      finalize(() => this.isLoading = false),
      tap(resp => {
        if (resp.results.length > 0) {
          this.userFavouriteOption = resp.results[0];
          this.form.get('display_name')?.setValue(this.userFavouriteOption.display_value);
        }
      }),
      catchError(err => {
        this.errorMessage = 'Failed to check existing favorites';
        return of(null);
      })
    );
  }

  private checkLabGroupFavourites(labGroups: LabGroup[]): void {
    this.alreadyFavouritedLabGroups = [];

    if (labGroups.length === 0) return;

    this.isLoading = true;

    const requests = labGroups.map(labGroup =>
      this.web.getFavouriteMetadataOptions(
        100, 0, this.value, 'service_lab_group', labGroup.id, this.name
      ).pipe(
        tap(resp => {
          if (resp.results.length > 0) {
            this.alreadyFavouritedLabGroups.push(labGroup);
            this.labGroupFavouriteMap[labGroup.id] = resp.results[0];
          }
        }),
        catchError(err => {
          console.error(`Error checking lab group ${labGroup.id}:`, err);
          return of(null);
        })
      )
    );

    forkJoin(requests).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      error: (err) => {
        this.errorMessage = 'Error checking lab group favourites';
        console.error(err);
      }
    });
  }

  removeFavouriteLabGroup(labGroup: LabGroup): void {
    if (this.labGroupFavouriteMap[labGroup.id]) {
      this.isLoading = true;
      this.web.deleteFavouriteMetadataOption(this.labGroupFavouriteMap[labGroup.id].id).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.alreadyFavouritedLabGroups = this.alreadyFavouritedLabGroups
            .filter(l => l.id !== labGroup.id);
          delete this.labGroupFavouriteMap[labGroup.id];
        },
        error: () => {
          this.errorMessage = 'Failed to remove from favorites';
        }
      });
    }
  }

  selectLabGroup(labGroup: LabGroup): void {
    if (this.alreadyFavouritedLabGroups.some(l => l.id === labGroup.id)) {
      return;
    }

    this.selectedLabGroup = this.selectedLabGroup?.id === labGroup.id ?
      undefined : labGroup;
  }

  removeFavouriteUser(): void {
    if (this.userFavouriteOption) {
      this.isLoading = true;
      this.web.deleteFavouriteMetadataOption(this.userFavouriteOption.id).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.userFavouriteOption = undefined;
        },
        error: () => {
          this.errorMessage = 'Failed to remove from favorites';
        }
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const result = this.selectedLabGroup ?
      { lab_group: this.selectedLabGroup.id, ...this.form.value } :
      { ...this.form.value };

    setTimeout(() => {
      this.isSubmitting = false;
      this.activeModal.close(result);
    }, 300);
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
