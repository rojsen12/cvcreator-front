import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar-component';

@Component({
  selector: 'app-choose-method',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './choose-method-component.html',
  styleUrl: './choose-method-component.css'
})
export class ChooseMethodComponent {
  constructor(private readonly router: Router) {}

  chooseAI(): void {
    this.router.navigate(['/cv-chat']);
  }

  chooseClassic(): void {
    this.router.navigate(['/create-cv']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
