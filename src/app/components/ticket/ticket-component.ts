import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminService, Ticket, TicketStats, TicketResponse, TicketFilter } from '../../services/admin-service';
import { NavbarComponent } from '../navbar/navbar-component';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ticket-component.html',
  styleUrls: ['./ticket-component.css']
})
export class TicketComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeMenu: string = 'dashboard';
  sidebarCollapsed: boolean = false;

  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  stats: TicketStats | null = null;

  filter: TicketFilter = {
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  };

  responseMessage: string = '';
  isSendingResponse: boolean = false;

  isLoading: boolean = true;
  isLoadingTicket: boolean = false;
  isUpdatingStatus: boolean = false;
  isUpdatingPriority: boolean = false;

  notification: Notification | null = null;

  statusOptions = [
    { value: 'all', label: 'Wszystkie statusy' },
    { value: 'open', label: 'Otwarte' },
    { value: 'in_progress', label: 'W trakcie' },
    { value: 'waiting', label: 'Oczekujące' },
    { value: 'resolved', label: 'Rozwiązane' },
    { value: 'closed', label: 'Zamknięte' }
  ];

  priorityOptions = [
    { value: 'all', label: 'Wszystkie priorytety' },
    { value: 'urgent', label: 'Pilne' },
    { value: 'high', label: 'Wysokie' },
    { value: 'medium', label: 'Średnie' },
    { value: 'low', label: 'Niskie' }
  ];

  categoryOptions = [
    { value: 'all', label: 'Wszystkie kategorie' },
    { value: 'technical', label: 'Techniczne' },
    { value: 'billing', label: 'Płatności' },
    { value: 'account', label: 'Konto' },
    { value: 'feature', label: 'Funkcje' },
    { value: 'other', label: 'Inne' }
  ];

  statusSelectOptions = [
    { value: 'open', label: 'Otwarte' },
    { value: 'in_progress', label: 'W trakcie' },
    { value: 'waiting', label: 'Oczekujące' },
    { value: 'resolved', label: 'Rozwiązane' },
    { value: 'closed', label: 'Zamknięte' }
  ];

  prioritySelectOptions = [
    { value: 'low', label: 'Niski' },
    { value: 'medium', label: 'Średni' },
    { value: 'high', label: 'Wysoki' },
    { value: 'urgent', label: 'Pilny' }
  ];

  menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'pi-home', badge: 0 },
    { id: 'tickets', label: 'Zgłoszenia', icon: 'pi-inbox', badge: 0 }
  ];

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTickets();

    this.adminService.tickets$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        this.tickets = tickets;
        this.applyFilters();
      });

    this.adminService.selectedTicket$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ticket => {
        this.selectedTicket = ticket;
        this.isLoadingTicket = false;
      });

    this.adminService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
        if (stats) {
          this.updateTicketsBadge(stats.open + stats.inProgress);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.adminService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: TicketStats) => {
        },
        error: (err: any) => {
          this.showNotification('error', 'Błąd podczas ładowania statystyk');
        }
      });
  }

  updateTicketsBadge(count: number): void {
    const ticketsMenu = this.menuItems.find(m => m.id === 'tickets');
    if (ticketsMenu) {
      ticketsMenu.badge = count;
    }
  }

  loadTickets(): void {
    this.isLoading = true;
    this.adminService.getAllTickets(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets: Ticket[]) => {
          this.isLoading = false;
        },
        error: (err: any) => {
          this.isLoading = false;
          this.showNotification('error', 'Błąd podczas ładowania zgłoszeń');
        }
      });
  }

  loadTicketDetails(ticketId: string): void {
    this.isLoadingTicket = true;
    this.adminService.getTicketById(ticketId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ticket: Ticket) => {
        },
        error: (err: any) => {
          this.isLoadingTicket = false;
          this.showNotification('error', 'Błąd podczas ładowania szczegółów zgłoszenia');
        }
      });
  }

  setActiveMenu(menuId: string): void {
    this.activeMenu = menuId;
    if (menuId === 'tickets') {
      this.loadTickets();
    } else if (menuId === 'dashboard') {
      this.loadStats();
    }
    this.adminService.clearSelectedTicket();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  applyFilters(): void {
    this.filteredTickets = this.tickets.filter(ticket => {
      if (this.filter.status && this.filter.status !== 'all') {
        if (ticket.status !== this.filter.status) return false;
      }
      if (this.filter.priority && this.filter.priority !== 'all') {
        if (ticket.priority !== this.filter.priority) return false;
      }
      if (this.filter.category && this.filter.category !== 'all') {
        if (ticket.category !== this.filter.category) return false;
      }
      if (this.filter.search) {
        const searchLower = this.filter.search.toLowerCase();
        const matchesSubject = ticket.subject.toLowerCase().includes(searchLower);
        const matchesUser = ticket.userName.toLowerCase().includes(searchLower);
        const matchesEmail = ticket.userEmail.toLowerCase().includes(searchLower);
        const matchesId = ticket.id.toLowerCase().includes(searchLower);
        if (!matchesSubject && !matchesUser && !matchesEmail && !matchesId) return false;
      }
      return true;
    });

    this.filteredTickets.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filter = {
      status: 'all',
      priority: 'all',
      category: 'all',
      search: ''
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.filter.search !== '' ||
      this.filter.status !== 'all' ||
      this.filter.priority !== 'all' ||
      this.filter.category !== 'all';
  }

  selectTicket(ticket: Ticket): void {
    this.loadTicketDetails(ticket.id);
  }

  closeTicketDetails(): void {
    this.adminService.clearSelectedTicket();
    this.responseMessage = '';
  }

  onStatusChange(ticketId: string, newStatus: string): void {
    this.updateStatus(ticketId, newStatus);
  }

  onQuickStatusChange(ticketId: string, event: Event): void {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    this.updateStatus(ticketId, newStatus);
  }

  updateStatus(ticketId: string, status: string): void {
    this.isUpdatingStatus = true;

    this.adminService.updateTicketStatus(ticketId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTicket: Ticket) => {

          const index = this.tickets.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            this.tickets[index] = { ...this.tickets[index], status: updatedTicket.status, updatedAt: updatedTicket.updatedAt };
          }

          if (this.selectedTicket?.id === ticketId) {
            this.selectedTicket = { ...this.selectedTicket, status: updatedTicket.status, updatedAt: updatedTicket.updatedAt };
          }

          this.applyFilters();
          this.loadStats();
          this.isUpdatingStatus = false;

          this.showNotification('success', `Status zmieniony na: ${this.getStatusLabel(status)}`);
        },
        error: (err: any) => {
          this.isUpdatingStatus = false;
          this.showNotification('error', 'Błąd podczas zmiany statusu');

          if (this.selectedTicket?.id === ticketId) {
            this.loadTicketDetails(ticketId);
          }
        }
      });
  }

  onPriorityChange(ticketId: string, newPriority: string): void {
    this.updatePriority(ticketId, newPriority);
  }

  onQuickPriorityChange(ticketId: string, event: Event): void {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const newPriority = select.value;
    this.updatePriority(ticketId, newPriority);
  }

  updatePriority(ticketId: string, priority: string): void {
    this.isUpdatingPriority = true;

    this.adminService.updateTicketPriority(ticketId, priority)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTicket: Ticket) => {

          const index = this.tickets.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            this.tickets[index] = { ...this.tickets[index], priority: updatedTicket.priority, updatedAt: updatedTicket.updatedAt };
          }

          if (this.selectedTicket?.id === ticketId) {
            this.selectedTicket = { ...this.selectedTicket, priority: updatedTicket.priority, updatedAt: updatedTicket.updatedAt };
          }

          this.applyFilters();
          this.isUpdatingPriority = false;

          this.showNotification('success', `Priorytet zmieniony na: ${this.getPriorityLabel(priority)}`);
        },
        error: (err: any) => {
          this.isUpdatingPriority = false;
          this.showNotification('error', 'Błąd podczas zmiany priorytetu');

          if (this.selectedTicket?.id === ticketId) {
            this.loadTicketDetails(ticketId);
          }
        }
      });
  }

  sendResponse(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) return;

    this.isSendingResponse = true;
    this.adminService.addResponse(this.selectedTicket.id, this.responseMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TicketResponse) => {
          this.responseMessage = '';
          this.isSendingResponse = false;
          this.showNotification('success', 'Odpowiedź została wysłana');
        },
        error: (err: any) => {
          this.isSendingResponse = false;
          this.showNotification('error', 'Błąd podczas wysyłania odpowiedzi');
        }
      });
  }

  deleteTicket(ticketId: string): void {
    if (confirm('Czy na pewno chcesz usunąć to zgłoszenie? Ta operacja jest nieodwracalna.')) {
      this.adminService.deleteTicket(ticketId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.applyFilters();
            this.loadStats();
            this.showNotification('success', 'Zgłoszenie zostało usunięte');
          },
          error: (err: any) => {
            this.showNotification('error', 'Błąd podczas usuwania zgłoszenia');
          }
        });
    }
  }

  showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.notification = { type, message };

    setTimeout(() => {
      this.hideNotification();
    }, 4000);
  }

  hideNotification(): void {
    this.notification = null;
  }

  hasBadge(item: MenuItem): boolean {
    return item.badge !== undefined && item.badge > 0;
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
    const classes: { [key: string]: string } = {
      'open': 'status-open',
      'in_progress': 'status-progress',
      'waiting': 'status-waiting',
      'resolved': 'status-resolved',
      'closed': 'status-closed'
    };
    return classes[status] || '';
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
    const classes: { [key: string]: string } = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'urgent': 'priority-urgent'
    };
    return classes[priority] || '';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'technical': 'Techniczne',
      'billing': 'Płatności',
      'account': 'Konto',
      'feature': 'Funkcje',
      'other': 'Inne'
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'technical': 'pi-wrench',
      'billing': 'pi-credit-card',
      'account': 'pi-user',
      'feature': 'pi-star',
      'other': 'pi-question-circle'
    };
    return icons[category] || 'pi-tag';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    return this.formatDate(date);
  }

  getTicketShortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket.id;
  }
}
