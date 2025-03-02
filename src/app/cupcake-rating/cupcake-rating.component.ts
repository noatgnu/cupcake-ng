import {Component, Input} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {NgbRating} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-cupcake-rating',
    imports: [
        NgOptimizedImage,
        NgbRating
    ],
    templateUrl: './cupcake-rating.component.html',
    styleUrl: './cupcake-rating.component.scss'
})
export class CupcakeRatingComponent {
  @Input() rating: number = 0;

  constructor() { }

}
