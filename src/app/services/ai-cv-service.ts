import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiCvService {

  private readonly API = 'http://localhost:8080/api/ai/cv';

  constructor(private http: HttpClient) {}

  sendPrompt(payload: any): Observable<any> {
    return this.http.post(
      this.API,
      payload,
      { withCredentials: true }
    );
  }
}
