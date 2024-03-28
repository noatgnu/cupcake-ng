import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {WebService} from "../web.service";
import {error} from "@angular/compiler-cli/src/transformers/util";
import {DataService} from "../data.service";
import {Router} from "@angular/router";
import {DatePipe, NgOptimizedImage} from "@angular/common";
import {resolve} from "@angular/compiler-cli";
import {ProtocolQuery} from "../protocol";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    DatePipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('logo') logo?: ElementRef;

  form = this.fb.group({
    url: new FormControl('', Validators.required),
  })
  protocolQuery?: ProtocolQuery;
  constructor(private router: Router, private fb: FormBuilder, private web: WebService, private dataService: DataService) {

  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.getUserProtocols()
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.form.value.url) {
        this.web.postProtocol(this.form.value.url).subscribe(
          (response) => {
            this.dataService.protocol = response;
            localStorage.setItem('protocol', JSON.stringify(response));
          },
          (error) => {
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
    this.router.navigate(['/protocol-editor']);
  }

  getUserProtocols(url?: string) {
    this.web.getUserProtocols(url).subscribe((response) => {
      this.protocolQuery = response;
    })
  }
}
