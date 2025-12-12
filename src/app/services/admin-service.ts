import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  todayNew: number;
}

export interface TicketFilter {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  blocked?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();

  private statsSubject = new BehaviorSubject<TicketStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  private selectedTicketSubject = new BehaviorSubject<Ticket | null>(null);
  public selectedTicket$ = this.selectedTicketSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllTickets(filter?: TicketFilter): Observable<Ticket[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        params = params.set('status', filter.status);
      }
      if (filter.priority && filter.priority !== 'all') {
        params = params.set('priority', filter.priority);
      }
      if (filter.category && filter.category !== 'all') {
        params = params.set('category', filter.category);
      }
      if (filter.search) {
        params = params.set('search', filter.search);
      }
      if (filter.dateFrom) {
        params = params.set('dateFrom', filter.dateFrom.toISOString());
      }
      if (filter.dateTo) {
        params = params.set('dateTo', filter.dateTo.toISOString());
      }
    }

    return this.http.get<Ticket[]>(`${this.apiUrl}/tickets`, {
      params,
      withCredentials: true
    }).pipe(
      tap(tickets => {
        this.ticketsSubject.next(tickets);
      })
    );
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${id}`, {
      withCredentials: true
    }).pipe(
      tap(ticket => {
        this.selectedTicketSubject.next(ticket);
      })
    );
  }

  getStats(): Observable<TicketStats> {
    return this.http.get<TicketStats>(`${this.apiUrl}/tickets/stats`, {
      withCredentials: true
    }).pipe(
      tap(stats => {
        this.statsSubject.next(stats);
      })
    );
  }

  updateTicketStatus(ticketId: string, status: string): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.apiUrl}/tickets/${ticketId}/status`,
      { status },
      { withCredentials: true }
    ).pipe(
      tap(updatedTicket => {
        this.updateTicketInList(updatedTicket);
        if (this.selectedTicketSubject.value?.id === ticketId) {
          this.selectedTicketSubject.next(updatedTicket);
        }
      })
    );
  }

  updateTicketPriority(ticketId: string, priority: string): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.apiUrl}/tickets/${ticketId}/priority`,
      { priority },
      { withCredentials: true }
    ).pipe(
      tap(updatedTicket => {
        this.updateTicketInList(updatedTicket);
        if (this.selectedTicketSubject.value?.id === ticketId) {
          this.selectedTicketSubject.next(updatedTicket);
        }
      })
    );
  }

  addResponse(ticketId: string, message: string): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(
      `${this.apiUrl}/tickets/${ticketId}/responses`,
      { message },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        const currentTicket = this.selectedTicketSubject.value;
        if (currentTicket?.id === ticketId) {
          const updatedTicket = {
            ...currentTicket,
            responses: [...(currentTicket.responses || []), response]
          };
          this.selectedTicketSubject.next(updatedTicket);
          this.updateTicketInList(updatedTicket);
        }
      })
    );
  }

  deleteTicket(ticketId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tickets/${ticketId}`, {
      withCredentials: true
    }).pipe(
      tap(() => {
        const currentTickets = this.ticketsSubject.value;
        this.ticketsSubject.next(currentTickets.filter(t => t.id !== ticketId));

        if (this.selectedTicketSubject.value?.id === ticketId) {
          this.selectedTicketSubject.next(null);
        }
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, {
      withCredentials: true
    });
  }

  toggleUserStatus(userId: string, blocked: boolean): Observable<User> {
    return this.http.patch<User>(
      `${this.apiUrl}/users/${userId}/status`,
      { blocked },
      { withCredentials: true }
    );
  }

  private updateTicketInList(updatedTicket: Ticket): void {
    const currentTickets = this.ticketsSubject.value;
    const index = currentTickets.findIndex(t => t.id === updatedTicket.id);
    if (index !== -1) {
      const newTickets = [...currentTickets];
      newTickets[index] = updatedTicket;
      this.ticketsSubject.next(newTickets);
    }
  }

  clearSelectedTicket(): void {
    this.selectedTicketSubject.next(null);
  }

  getCurrentStats(): TicketStats | null {
    return this.statsSubject.value;
  }

  getCurrentTickets(): Ticket[] {
    return this.ticketsSubject.value;
  }

  getSelectedTicket(): Ticket | null {
    return this.selectedTicketSubject.value;
  }
}
