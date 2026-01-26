import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { CV} from '../models/cv-model';

@Injectable({
  providedIn: 'root'
})
export class CVService {
  private apiUrl = 'http://localhost:8080/api/cv';
  private selectedTemplateSubject = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {}

  setSelectedTemplate(template: string): void {
    this.selectedTemplateSubject.next(template);
  }

  getSelectedTemplate(): string {
    return this.selectedTemplateSubject.value;
  }

  getAllCVs(): Observable<CV[]> {
    return this.http.get<CV[]>(this.apiUrl, {
      withCredentials: true
    });
  }

  getCVById(id: string): Observable<CV> {
    return this.http.get<CV>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }

  createCV(cv: CV): Observable<CV> {

    return this.http.post<CV>(this.apiUrl, cv, {
      withCredentials: true
    });
  }

  updateCV(id: string, cv: CV): Observable<CV> {
    return this.http.put<CV>(`${this.apiUrl}/${id}`, cv, {
      withCredentials: true
    });
  }

  deleteCV(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }
}
