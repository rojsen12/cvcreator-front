import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CVService} from '../../services/cv-service';
import { NavbarComponent} from '../navbar/navbar-component';

interface CVTemplate {
  id: string;
  name: string;
  preview: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-create-cv',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './create-cv-component.html',
  styleUrls: ['./create-cv-component.css']
})
export class CreateCvComponent implements OnInit {
  templates: CVTemplate[] = [
    {
      id: 'modern',
      name: 'Modern',
      preview: 'assets/templates/modern-preview.png',
      description: 'Nowoczesny szablon z czystym designem',
      color: '#3b82f6'
    },
    {
      id: 'classic',
      name: 'Classic',
      preview: 'assets/templates/classic-preview.png',
      description: 'Klasyczny szablon w tradycyjnym stylu',
      color: '#1e293b'
    },
    {
      id: 'creative',
      name: 'Creative',
      preview: 'assets/templates/creative-preview.png',
      description: 'Kreatywny szablon dla branż artystycznych',
      color: '#8b5cf6'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      preview: 'assets/templates/minimal-preview.png',
      description: 'Minimalistyczny szablon dla profesjonalistów',
      color: '#10b981'
    }
  ];

  selectedTemplate: string = '';

  constructor(
    private cvService: CVService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  selectTemplate(templateId: string): void {
    this.selectedTemplate = templateId;
  }

  continueToEdit(): void {
    if (this.selectedTemplate) {
      this.cvService.setSelectedTemplate(this.selectedTemplate);
      this.router.navigate(['/edit-cv']);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
