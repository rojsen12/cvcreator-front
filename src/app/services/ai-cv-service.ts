import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SectionRequest {
  sectionType: string;
  currentText: string;
  userMessage: string;
  language: string;
}

export interface SectionResponse {
  content: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AiCvService {
  private apiUrl = 'http://localhost:8080/api/cv-ai';

  constructor(private http: HttpClient) {
  }

  generate(request: SectionRequest): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(
      `${this.apiUrl}/generate`,
      request,
      {withCredentials: true}
    );
  }

}
