import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import {
  NgbActiveModal, NgbModal,
  NgbNav,
  NgbNavContent,
  NgbNavItem, NgbNavLink,
  NgbNavOutlet,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { Instrument, SupportInformation, ExternalContact, ExternalContactDetails} from "../../../instrument";
import { WebService} from "../../../web.service";
import {ToastService} from "../../../toast.service";
import {DatePipe, NgClass} from '@angular/common';
import { InstrumentSupportInformationService} from "../../../instrument-support-information.service";
import { Observable, of, switchMap, map, debounceTime, distinctUntilChanged, tap, catchError } from 'rxjs';
import { BarcodeScannerModalComponent } from '../../../barcode-scanner-modal/barcode-scanner-modal.component';
import {InstrumentService} from "../../../instrument.service";

@Component({
  selector: 'app-instrument-support-maintenance-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbNavOutlet,
    NgbNavItem,
    NgbNav,
    DatePipe,
    NgbTypeahead,
    NgbNavContent,
    NgbNavLink,
    NgClass
  ],
  templateUrl: './instrument-support-maintenance-modal.component.html',
  styleUrls: ['./instrument-support-maintenance-modal.component.scss']
})
export class InstrumentSupportMaintenanceModalComponent implements OnInit {
  searching = false;
  searchFailed = false;
  selectedLocation: any = null;
  active: number = 1
  private _instrumentId?: number;
  checkingMaintenance = false;

  @Input() set instrumentId(instrumentId: number) {
    this._instrumentId = instrumentId;
    this.supportService.getInstrumentSupportInformation(instrumentId).subscribe(
      (data: SupportInformation[]) => {
        this.supportInfo = data[0];
        this.updateFormWithData(data[0]);

      },
      (error: any) => {
        console.error('Error loading support info:', error);
      }
    )
  }

  get instrumentId(): number {
    return this._instrumentId!;
  }

  @Input() supportInfoId?: number;

  loading = false;
  activeTab = 'basic';
  supportInfoForm!: FormGroup;
  supportInfo?: SupportInformation;

  contactTypes = ['email', 'phone', 'website', 'address', 'other'];
  formatter = (location: {id: number, object_name: string, object_type?: string, object_description?: string}) => {
    let display = location.object_name;

    if (location.object_type) {
      display += ` (${location.object_type})`;
    }

    if (location.object_description) {
      display += ` - ${location.object_description}`;
    }

    return display;
  };
  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private supportService: InstrumentSupportInformationService,
    private toast: ToastService,
    private webService: WebService,
    private modalService: NgbModal,
    private instrumentService: InstrumentService
  ) { }

  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term => {
        if (term.length < 2) {
          return of([]);
        }
        return this.webService.getStorageObjects(undefined, 10, undefined, term).pipe(
          map((response: any) => response.results || []),
          catchError(() => {
            this.searchFailed = true;
            return of([]);
          })
        );
      }),
      tap(() => {
        this.searching = false;
        this.searchFailed = false;
      })
    );
  }

  onLocationSelect(event: any): void {
    // When a location is selected from typeahead
    this.supportInfoForm.patchValue({
      location_id: event.item.id
    });
    this.selectedLocation = event.item;
  }

  ngOnInit(): void {
    this.initForm();

    if (this.supportInfoId) {
      this.loading = true;
      this.supportService.getSupportInformation(this.supportInfoId)
        .subscribe(
          (data: SupportInformation) => {
            this.supportInfo = data;
            this.updateFormWithData(data);
            this.loading = false;
          },
          (error: any) => {
            console.error('Error loading support info:', error);
            this.loading = false;
          }
        );
    }
  }

  initForm(): void {
    this.supportInfoForm = this.fb.group({
      vendor_name: ['', Validators.required],
      manufacturer_name: ['', Validators.required],
      vendor_contacts: this.fb.array([]),
      manufacturer_contacts: this.fb.array([]),
      serial_number: [''],
      maintenance_frequency_days: [null],
      location_id: [null],
      warranty_start_date: [null],
      warranty_end_date: [null],
    });
  }

  updateFormWithData(data: SupportInformation): void {
    this.supportInfoForm.patchValue({
      vendor_name: data.vendor_name,
      manufacturer_name: data.manufacturer_name,
      serial_number: data.serial_number || '',
      maintenance_frequency_days: data.maintenance_frequency_days || null,
      location_id: data.location?.id || null,
      warranty_start_date: data.warranty_start_date ? new Date(data.warranty_start_date).toISOString().split('T')[0] : null,
      warranty_end_date: data.warranty_end_date ? new Date(data.warranty_end_date).toISOString().split('T')[0] : null,
    });

    this.vendorContacts.clear();
    this.manufacturerContacts.clear();

    if (data.vendor_contacts && data.vendor_contacts.length > 0) {
      data.vendor_contacts.forEach(contact => {
        const contactForm = this.createContactForm(contact);
        this.vendorContacts.push(contactForm);
      });
    }

    if (data.manufacturer_contacts && data.manufacturer_contacts.length > 0) {
      data.manufacturer_contacts.forEach(contact => {
        const contactForm = this.createContactForm(contact);
        this.manufacturerContacts.push(contactForm);
      });
    }

    if (data.location) {
      this.selectedLocation = data.location;
    }
  }

  get vendorContacts(): FormArray {
    return this.supportInfoForm.get('vendor_contacts') as FormArray;
  }

  get manufacturerContacts(): FormArray {
    return this.supportInfoForm.get('manufacturer_contacts') as FormArray;
  }

  createContactForm(contact?: ExternalContact): FormGroup {
    const contactForm = this.fb.group({
      id: [contact?.id || null],
      contact_name: [contact?.contact_name || '',],
      contact_details: this.fb.array([])
    });

    const detailsArray = contactForm.get('contact_details') as FormArray;

    if (contact?.contact_details && contact.contact_details.length > 0) {
      contact.contact_details.forEach(detail => {
        detailsArray.push(this.createDetailForm(detail));
      });
    }

    return contactForm;
  }

  createDetailForm(detail?: ExternalContactDetails): FormGroup {
    return this.fb.group({
      id: [detail?.id || null],
      contact_method_alt_name: [detail?.contact_method_alt_name || '', Validators.required],
      contact_type: [detail?.contact_type || 'email', Validators.required],
      contact_value: [detail?.contact_value || '', Validators.required]
    });
  }

  getContactDetails(contactForm: AbstractControl): FormArray {
    return (contactForm as FormGroup).get('contact_details') as FormArray;
  }

  addVendorContact(): void {
    this.vendorContacts.push(this.createContactForm());
  }

  addManufacturerContact(): void {
    this.manufacturerContacts.push(this.createContactForm());
  }

  addContactDetail(contactForm: AbstractControl): void {
    const details = this.getContactDetails(contactForm);
    details.push(this.createDetailForm());
  }

  removeVendorContact(index: number): void {
    const contact = this.vendorContacts.at(index).value;
    if (contact.id && this.supportInfo?.id) {
      this.supportService.removeContact(this.supportInfo.id, contact.id, 'vendor')
        .subscribe(() => {
          this.vendorContacts.removeAt(index);
        });
    } else {
      this.vendorContacts.removeAt(index);
    }
  }

  removeManufacturerContact(index: number): void {
    const contact = this.manufacturerContacts.at(index).value;
    if (contact.id && this.supportInfo?.id) {
      this.supportService.removeContact(this.supportInfo.id, contact.id, 'manufacturer')
        .subscribe(() => {
          this.manufacturerContacts.removeAt(index);
        });
    } else {
      this.manufacturerContacts.removeAt(index);
    }
  }

  removeContactDetail(contactForm: AbstractControl, index: number): void {
    const contactFormGroup = contactForm as FormGroup;
    const details = this.getContactDetails(contactFormGroup);
    const detail = details.at(index).value;

    if (detail.id && contactFormGroup.value.id) {
      this.supportService.removeContactDetail(contactFormGroup.value.id, detail.id)
        .subscribe(() => {
          details.removeAt(index);
        });
    } else {
      details.removeAt(index);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  async saveBasicInfo(): Promise<void> {
    if (this.supportInfo?.id) {
      const location = await this.getLocationObject();

      const basicData = {
        vendor_name: this.supportInfoForm.get('vendor_name')?.value,
        manufacturer_name: this.supportInfoForm.get('manufacturer_name')?.value,
        serial_number: this.supportInfoForm.get('serial_number')?.value,
        maintenance_frequency_days: this.supportInfoForm.get('maintenance_frequency_days')?.value,
        location: location,
        warranty_start_date: this.supportInfoForm.get('warranty_start_date')?.value,
        warranty_end_date: this.supportInfoForm.get('warranty_end_date')?.value,
      };

      this.supportService.updateSupportInformation(this.supportInfo.id, basicData)
        .subscribe((data: SupportInformation) => {
          this.supportInfo = { ...this.supportInfo, ...data };
        });
    } else {
      this.createSupportInformation();
    }
  }

  async createSupportInformation(): Promise<void> {
    const formValue = this.supportInfoForm.value;
    const location = await this.getLocationObject();

    const initialData: SupportInformation = {
      vendor_name: formValue.vendor_name,
      manufacturer_name: formValue.manufacturer_name,
      serial_number: formValue.serial_number,
      maintenance_frequency_days: formValue.maintenance_frequency_days,
      location: location,
      warranty_start_date: formValue.warranty_start_date,
      warranty_end_date: formValue.warranty_end_date,
      vendor_contacts: [],
      manufacturer_contacts: []
    };

    if (this.instrumentId) {
      this.supportService.createAndAddSupportInformation(this.instrumentId, initialData)
        .subscribe((data: SupportInformation) => {
          this.supportInfo = data;
          this.addAllContacts();
        });
    } else {
      this.toast.show("Error", "Instrument ID is not provided");
    }
  }

  saveVendorContact(index: number): void {
    const contactForm = this.vendorContacts.at(index) as FormGroup;
    const contactData = contactForm.value;

    if (this.supportInfo?.id) {
      if (contactData.id) {
        this.supportService.updateExternalContact(contactData.id, contactData)
          .subscribe((updatedContact: ExternalContact) => {
          });
      } else {
        this.supportService.addVendorContact(this.supportInfo.id, contactData)
          .subscribe((newContact: ExternalContact) => {
            contactForm.get('id')?.setValue(newContact.id);
          });
      }
    }
  }

  saveManufacturerContact(index: number): void {
    const contactForm = this.manufacturerContacts.at(index) as FormGroup;
    const contactData = contactForm.value;

    if (this.supportInfo?.id) {
      if (contactData.id) {
        this.supportService.updateExternalContact(contactData.id, contactData)
          .subscribe((updatedContact: ExternalContact) => {
          });
      } else {
        this.supportService.addManufacturerContact(this.supportInfo.id, contactData)
          .subscribe((newContact: ExternalContact) => {
            contactForm.get('id')?.setValue(newContact.id);
          });
      }
    }
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  asFormArray(control: AbstractControl): FormArray {
    return control as FormArray;
  }

  saveContactDetail(contactForm: AbstractControl, index: number): void {
    const contactFormGroup = contactForm as FormGroup;
    const contactId = contactFormGroup.get('id')?.value;
    const detailsArray = this.getContactDetails(contactFormGroup);
    const detailForm = detailsArray.at(index) as FormGroup;
    const detailData = detailForm.value;

    if (contactId) {
      if (detailData.id) {
        // Update existing detail
        this.supportService.updateContactDetail(detailData.id, detailData)
          .subscribe();
      } else {
        // Add new detail
        this.supportService.addContactDetail(contactId, detailData)
          .subscribe((newDetail: ExternalContactDetails) => {
            detailForm.get('id')?.setValue(newDetail.id);
          });
      }
    }
  }


  addAllContacts(): void {
    if (this.supportInfo?.id) {
      for (let i = 0; i < this.vendorContacts.length; i++) {
        this.saveVendorContact(i);
      }
      for (let i = 0; i < this.manufacturerContacts.length; i++) {
        this.saveManufacturerContact(i);
      }
    }
  }

  submitForm(): void {
    if (this.supportInfoForm.invalid) {
      return;
    }

    if (this.supportInfo?.id) {
      this.saveBasicInfo();
      this.addAllContacts();
    } else {
      this.createSupportInformation();
    }

    this.close();
  }

  close(): void {
    this.activeModal.close(this.supportInfo);
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }

  getLocationObject(): Promise<{ id: number; object_name: string; object_type: string; object_description: string; } | undefined> {
    const locationId = this.supportInfoForm.get('location_id')?.value;

    if (this.selectedLocation && this.selectedLocation.id === locationId) {
      return Promise.resolve({
        id: this.selectedLocation.id,
        object_name: this.selectedLocation.object_name,
        object_type: this.selectedLocation.object_type || 'location',
        object_description: this.selectedLocation.object_description || ''
      });
    }

    if (!locationId) return Promise.resolve(undefined);

    return new Promise<{ id: number; object_name: string; object_type: string; object_description: string; } | undefined>((resolve) => {
      this.webService.getStorageObject(locationId).subscribe({
        next: (location: any) => {
          if (location) {
            resolve({
              id: location.id,
              object_name: location.object_name,
              object_type: location.object_type || 'location',
              object_description: location.object_description || ''
            });
          } else {
            resolve(undefined);
          }
        },
        error: () => {
          resolve(undefined);
        }
      });
    });
  }

  clearSelectedLocation(): void {
    this.selectedLocation = null;
    this.supportInfoForm.patchValue({
      location_id: null
    });
  }

  openBarcodeScanner(): void {
    const modalRef = this.modalService.open(BarcodeScannerModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.enableSearch = false;
    modalRef.result.then((barcode: any) => {
      if (barcode) {
        this.supportInfoForm.patchValue({
          serial_number: barcode.barcode
        });
      }
    })
  }

  triggerMaintenanceCheck(): void {
    this.checkingMaintenance = true;

    const daysBeforeWarrantyWarning = 30;
    const daysBeforeMaintenanceWarning = 15;

    this.instrumentService.triggerInstrumentCheck(
      this.instrumentId,
      daysBeforeWarrantyWarning,
      daysBeforeMaintenanceWarning
    ).subscribe(
      (response: any) => {
        this.checkingMaintenance = false;
        this.toast.show("Maintenance Check", "Successfully triggered maintenance and warranty check");
      },
      (error: any) => {
        this.checkingMaintenance = false;
        this.toast.show("Maintenance Check", "Failed to trigger maintenance check");
        console.error('Error triggering maintenance check:', error);
      }
    );
  }
}
