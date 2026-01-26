import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

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

export interface CreateTicketDTO {
  subject: string;
  message: string;
  category: string;
  priority: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8080/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, data);
  }

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, data, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        if (response.user) {
          const user: User = {
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            role: response.user.role
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      })
    );
  }

  checkAuth(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`, {
      withCredentials: true
    }).pipe(
      tap((user: User) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'ADMIN';
  }

  createTicket(ticket: CreateTicketDTO): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/tickets`, ticket, {
      withCredentials: true
    });
  }

  getMyTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/tickets/my`, {
      withCredentials: true
    });
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${id}`, {
      withCredentials: true
    });
  }

  addTicketResponse(ticketId: string, message: string): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(
      `${this.apiUrl}/tickets/${ticketId}/responses`,
      { message },
      { withCredentials: true }
    );
  }
}
