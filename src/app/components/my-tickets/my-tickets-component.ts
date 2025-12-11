import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Ticket, TicketResponse } from '../../api/api.service';
import { NavbarComponent } from '../navbar/navbar-component';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  templateUrl: './my-tickets-component.html',
  styleUrls: ['./my-tickets-component.css']
})
export class MyTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  isLoading = true;
  responseMessage = '';
  isSendingResponse = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.apiService.getMyTickets().subscribe({
      next: (tickets: Ticket[]) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
      }
    });
  }

  selectTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.responseMessage = '';
  }

  closeDetails(): void {
    this.selectedTicket = null;
  }

  sendResponse(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) return;

    this.isSendingResponse = true;
    this.apiService.addTicketResponse(this.selectedTicket.id, this.responseMessage).subscribe({
      next: (response: TicketResponse) => {
        if (this.selectedTicket) {
          this.selectedTicket.responses = this.selectedTicket.responses || [];
          this.selectedTicket.responses.push(response);
        }
        this.responseMessage = '';
        this.isSendingResponse = false;
      },
      error: (err: any) => {
        this.isSendingResponse = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Otwarte',
      'in_progress': 'W trakcie',
      'waiting': 'Oczekujące',
      'resolved': 'Rozwiązane',
      'closed': 'Zamknięte'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'low': 'Niski',
      'medium': 'Średni',
      'high': 'Wysoki',
      'urgent': 'Pilny'
    };
    return labels[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
