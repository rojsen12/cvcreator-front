import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../api/api.service';
import { NavbarComponent } from '../navbar/navbar-component';
import {TicketCategory, TicketPriority} from '../../models/ticket-model';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, RouterLink],
  templateUrl: './create-ticket-component.html',
  styleUrls: ['./create-ticket-component.css']
})
export class CreateTicketComponent implements OnInit {
  ticketForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  categories: { value: TicketCategory; label: string }[] = [
    { value: 'technical', label: 'Problem techniczny' },
    { value: 'account', label: 'Konto użytkownika' },
    { value: 'feature', label: 'Propozycja funkcji' },
    { value: 'other', label: 'Inne' }
  ];

  priorities: { value: TicketPriority; label: string; description: string }[] = [
    { value: 'low', label: 'Niski', description: 'Nie pilne' },
    { value: 'medium', label: 'Średni', description: 'Normalne' },
    { value: 'high', label: 'Wysoki', description: 'Pilne' },
    { value: 'urgent', label: 'Krytyczny', description: 'Blokujące' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      category: ['technical', Validators.required],
      priority: ['medium', Validators.required],
      message: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  onSubmit(): void {
    if (this.ticketForm.valid) {
      this.isSubmitting = true;
      this.submitError = '';

      this.apiService.createTicket(this.ticketForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          setTimeout(() => {
            this.router.navigate(['/my-tickets']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.';
        }
      });
    } else {
      Object.keys(this.ticketForm.controls).forEach(key => {
        this.ticketForm.get(key)?.markAsTouched();
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/main-page']);
  }
}
