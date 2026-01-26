import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CvData } from '../components/cv-preview-component/cv-preview-component';

@Injectable({ providedIn: 'root' })
export class CvPersistenceService {
  private apiUrl = 'http://localhost:8080/api/cv-ai';

  constructor(private http: HttpClient) {}

  saveCv(cvData: CvData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/save`,
      cvData,
      { withCredentials: true }
    );
  }

  loadCv(): Observable<CvData> {
    return this.http.get<CvData>(
      `${this.apiUrl}/load`,
      { withCredentials: true }
    );
  }
}
