import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CVService} from '../../services/cv-service';
import { CV} from '../../models/cv-model';
import { NavbarComponent} from '../navbar/navbar-component';

@Component({
  selector: 'app-my-cvs',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './my-cvs-component.html',
  styleUrls: ['./my-cvs-component.css']
})
export class MyCvsComponent implements OnInit {
  cvs: CV[] = [];
  loading: boolean = true;
  error: string = '';
  deletingId: string | null = null;

  constructor(
    private cvService: CVService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCVs();
  }

  loadCVs(): void {
    this.loading = true;
    this.error = '';

    this.cvService.getAllCVs().subscribe({
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
    if (id) {
      this.router.navigate(['/preview-cv', id]);
    }
  }

  editCV(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/edit-cv', id]);
    }
  }

  deleteCV(id: string | undefined, event: Event): void {
    event.stopPropagation();

    if (!id) return;

    const confirmed = confirm('Czy na pewno chcesz usunąć to CV?');
    if (!confirmed) return;

    this.deletingId = id;

    this.cvService.deleteCV(id).subscribe({
      next: () => {
        this.cvs = this.cvs.filter(cv => cv.id !== id);
        this.deletingId = null;
      },
      error: (err) => {
        alert('Nie udało się usunąć CV');
        this.deletingId = null;
      }
    });
  }

  downloadPDF(cv: CV, event: Event): void {
    event.stopPropagation();
    alert(`Pobieranie CV: ${cv.firstName} ${cv.lastName}\n(Funkcja PDF wkrótce!)`);
  }

  getFullName(cv: CV): string {
    return `${cv.firstName} ${cv.lastName}`;
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

  getExperienceCount(cv: CV): number {
    return cv.experiences?.length || 0;
  }

  getEducationCount(cv: CV): number {
    return cv.educations?.length || 0;
  }

  getSkillsCount(cv: CV): number {
    return cv.skills?.length || 0;
  }
}
