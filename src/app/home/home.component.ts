import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {WebService} from "../web.service";
import {error} from "@angular/compiler-cli/src/transformers/util";
import {DataService} from "../data.service";
import {Router} from "@angular/router";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('logo') logo?: ElementRef;

  form = this.fb.group({
    url: new FormControl('', Validators.required),
  })
  constructor(private router: Router, private fb: FormBuilder, private web: WebService, private dataService: DataService) {

  }

  ngOnInit() {

  }

  ngAfterViewInit() {

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
            this.router.navigate(['/protocol-session'])
          }
        )
      }
    }
  }
}
