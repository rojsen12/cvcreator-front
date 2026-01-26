import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CVService } from '../../services/cv-service';
import { CV } from '../../models/cv-model';
import { NavbarComponent } from '../navbar/navbar-component';

@Component({
  selector: 'app-preview-cv',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './preview-cv-component.html',
  styleUrls: ['./preview-cv-component.css']
})
export class PreviewCvComponent implements OnInit {
  cv: CV | null = null;
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cvService: CVService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadCV(id);
    } else {
      this.error = 'Brak ID CV';
      this.loading = false;
    }
  }

  loadCV(id: string): void {
    this.cvService.getCVById(id).subscribe({
      next: (cv) => {
        this.cv = cv;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Nie udało się załadować CV';
        this.loading = false;
      }
    });
  }

  editCV(): void {
    if (this.cv?.id) {
      this.router.navigate(['/edit-cv', this.cv.id]);
    }
  }

  downloadPDF(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/my-cvs']);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Obecnie';
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  }

  getFullName(): string {
    return `${this.cv?.firstName} ${this.cv?.lastName}`;
  }
}
