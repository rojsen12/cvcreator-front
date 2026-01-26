import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CVService} from '../../services/cv-service';
import { AllCvsService, UnifiedCV} from '../../services/all-cvs-service';
import { CV } from '../../models/cv-model';
import { NavbarComponent} from '../navbar/navbar-component';

@Component({
  selector: 'app-my-cvs',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './my-cvs-component.html',
  styleUrls: ['./my-cvs-component.css']
})
export class MyCvsComponent implements OnInit {
  cvs: UnifiedCV[] = [];
  loading: boolean = true;
  error: string = '';
  deletingId: string | null = null;

  constructor(
    private cvService: CVService,
    private allCvsService: AllCvsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCVs();
  }

  loadCVs(): void {
    this.loading = true;
    this.error = '';

    this.allCvsService.getAllCVs().subscribe({
      next: (cvs) => {
        this.cvs = cvs;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Nie udało się załadować CV';
        this.loading = false;
      }
    });
  }

  createNewCV(): void {
    this.router.navigate(['/create-cv']);
  }

  viewCV(id: string | undefined): void {
    if (!id) return;

    const cv = this.cvs.find(c => c.id === id);
    if (!cv) {
      this.router.navigate(['/preview-cv', id]);
      return;
    }

    if (cv.type === 'normal') {
      this.router.navigate(['/preview-cv', id]);
    } else {
      this.router.navigate(['/cv-preview'], { state: { cv: cv.data } });
    }
  }

  editCV(id: string | undefined): void {
    if (!id) return;

    const cv = this.cvs.find(c => c.id === id);
    if (!cv) {
      this.router.navigate(['/edit-cv', id]);
      return;
    }

    if (cv.type === 'normal') {
      this.router.navigate(['/edit-cv', id]);
    } else {
      this.router.navigate(['/cv-chat'], { state: { loadExisting: true } });
    }
  }

  deleteCV(id: string | undefined, event: Event): void {
    event.stopPropagation();

    if (!id) return;

    const confirmed = confirm('Czy na pewno chcesz usunąć to CV?');
    if (!confirmed) return;

    this.deletingId = id;

    const cv = this.cvs.find(c => c.id === id);

    if (cv && cv.type === 'ai') {
      this.allCvsService.deleteCV(cv).subscribe({
        next: () => {
          this.cvs = this.cvs.filter(c => c.id !== id);
          this.deletingId = null;
        },
        error: (err) => {
          alert('Nie udało się usunąć CV');
          this.deletingId = null;
        }
      });
    } else {
      this.cvService.deleteCV(id).subscribe({
        next: () => {
          this.cvs = this.cvs.filter(c => c.id !== id);
          this.deletingId = null;
        },
        error: (err) => {
          alert('Nie udało się usunąć CV');
          this.deletingId = null;
        }
      });
    }
  }

  downloadPDF(cv: CV | UnifiedCV, event: Event): void {
    event.stopPropagation();

    const unifiedCv = cv as UnifiedCV;

    if (!unifiedCv.id) {
      alert('Błąd: Brak ID CV');
      return;
    }

    if (unifiedCv.type === 'ai') {
      this.router.navigate(['/cv-preview'], {
        state: { cv: unifiedCv.data, autoPrint: true }
      });
      return;
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/preview-cv', unifiedCv.id])
    );

    const win = window.open(url, '_blank');

    if (win) {
      win.addEventListener('load', () => {
        setTimeout(() => {
          win.print();
        }, 500);
      });

      const hasSeenTip = localStorage.getItem('pdf-tip-seen');
    } else {
      alert('Zablokowano okno popup. Włącz wyskakujące okna dla tej strony.');
    }
  }

  getFullName(cv: CV | UnifiedCV): string {
    const unifiedCv = cv as UnifiedCV;

    if (unifiedCv.type === 'ai') {
      return unifiedCv.name;
    }

    if (unifiedCv.type === 'normal') {
      const normalData = unifiedCv.data as CV;
      return `${normalData.firstName} ${normalData.lastName}`;
    }

    const normalCv = cv as CV;
    return `${normalCv.firstName} ${normalCv.lastName}`;
  }

  getTemplateGradient(templateType: string): string {
    const gradients: { [key: string]: string } = {
      'modern': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'classic': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      'creative': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'minimal': 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };
    return gradients[templateType] || gradients['modern'];
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getExperienceCount(cv: CV | UnifiedCV): number {
    const unifiedCv = cv as UnifiedCV;

    if (unifiedCv.type === 'ai') return 0;

    if (unifiedCv.type === 'normal') {
      const normalData = unifiedCv.data as CV;
      return normalData.experiences?.length || 0;
    }

    const normalCv = cv as CV;
    return normalCv.experiences?.length || 0;
  }

  getEducationCount(cv: CV | UnifiedCV): number {
    const unifiedCv = cv as UnifiedCV;

    if (unifiedCv.type === 'ai') return 0;

    if (unifiedCv.type === 'normal') {
      const normalData = unifiedCv.data as CV;
      return normalData.educations?.length || 0;
    }

    const normalCv = cv as CV;
    return normalCv.educations?.length || 0;
  }

  getSkillsCount(cv: CV | UnifiedCV): number {
    const unifiedCv = cv as UnifiedCV;

    if (unifiedCv.type === 'ai') return 0;

    if (unifiedCv.type === 'normal') {
      const normalData = unifiedCv.data as CV;
      return normalData.skills?.length || 0;
    }

    const normalCv = cv as CV;
    return normalCv.skills?.length || 0;
  }
}
