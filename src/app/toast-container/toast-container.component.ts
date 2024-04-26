import { Component } from '@angular/core';
import {ToastService} from "../toast.service";
import {NgbProgressbar, NgbToast} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from "@angular/common";
import {ToastProgressbarComponent} from "./toast-progressbar/toast-progressbar.component";

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    NgbToast,
    NgClass,
    NgbProgressbar,
    ToastProgressbarComponent
  ],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) { }
}
