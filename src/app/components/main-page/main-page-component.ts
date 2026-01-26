import { Component } from '@angular/core';
import {NavbarComponent} from '../navbar/navbar-component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-main-page-component',
  imports: [
    NavbarComponent
  ],
  templateUrl: './main-page-component.html',
  styleUrl: './main-page-component.css',
  standalone: true
})
export class MainPageComponent {
  constructor(private router: Router) {}

  createCV(): void {
    this.router.navigate(['/choose-method']);
  }


  viewMyCVs(): void {
    this.router.navigate(['/my-cvs']);
  }

}
