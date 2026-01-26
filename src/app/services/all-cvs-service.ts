import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CV {
  id: string;
  templateType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  profilePicture?: string;
  summary?: string;
  experiences: ExperienceDTO[];
  educations: EducationDTO[];
  skills: string[];
  languages: LanguageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceDTO {
  id?: string;
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface EducationDTO {
  id?: string;
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface LanguageDTO {
  id?: string;
  name: string;
  level: string;
}

export interface CVDocument {
  id: number;
  userId: string;
  personalInfo: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  interests: string;
  sectionOrder: string[];
  profilePhoto: string;
  lastModified: string;
}

export interface UnifiedCV {
  id: string;
  type: 'normal' | 'ai';
  name: string;
  templateType: string;
  createdAt: string;
  updatedAt?: string;
  email?: string;
  data: CV | CVDocument;
}

@Injectable({
  providedIn: 'root'
})
export class AllCvsService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getAllCVs(): Observable<UnifiedCV[]> {
    const normalCVs$ = this.http.get<CV[]>(`${this.apiUrl}/cv`, { withCredentials: true }).pipe(
      catchError(() => of([]))
    );

    const aiCV$ = this.http.get<CVDocument>(`${this.apiUrl}/cv-ai/my-ai-cv`, { withCredentials: true }).pipe(
      catchError(() => of(null))
    );

    return forkJoin([normalCVs$, aiCV$]).pipe(
      map(([normalCVs, aiCV]) => {
        console.log('=== ALL CVS DEBUG ===');
        console.log('Normal CVs count:', normalCVs.length);
        console.log('AI CV:', aiCV);

        const unified: UnifiedCV[] = [];

        normalCVs.forEach(cv => {
          unified.push({
            id: String(cv.id),
            type: 'normal',
            name: `${cv.firstName} ${cv.lastName}`,
            templateType: cv.templateType,
            createdAt: String(cv.createdAt),
            updatedAt: String(cv.updatedAt),
            email: cv.email,
            data: cv
          });
        });

        if (aiCV) {
          const aiName = this.extractNameFromHTML(aiCV.personalInfo) || 'CV z AI';
          const aiEmail = this.extractEmailFromHTML(aiCV.personalInfo);

          console.log('Adding AI CV:');
          console.log('  - Name:', aiName);
          console.log('  - Email:', aiEmail);
          console.log('  - Template:', 'AI Generated');

          unified.push({
            id: 'ai-' + aiCV.id,
            type: 'ai',
            name: aiName,
            templateType: 'AI Generated',
            createdAt: aiCV.lastModified,
            email: aiEmail,
            data: aiCV
          });
        }

        return unified.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    );
  }

  private extractNameFromHTML(html: string): string {
    if (!html) return '';

    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    const firstLine = lines[0] || 'CV z AI';

    if (firstLine.includes('@')) {
      return 'CV z AI';
    }

    if (firstLine.match(/\+?\d{2,}/)) {
      return 'CV z AI';
    }

    return firstLine;
  }

  private extractEmailFromHTML(html: string): string | undefined {
    if (!html) return undefined;

    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';

    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : undefined;
  }

  deleteCV(cv: UnifiedCV): Observable<void> {
    if (cv.type === 'normal') {
      return this.http.delete<void>(`${this.apiUrl}/cv/${cv.id}`, { withCredentials: true });
    } else {
      return this.http.delete<void>(`${this.apiUrl}/cv-ai/delete`, { withCredentials: true });
    }
  }
}
