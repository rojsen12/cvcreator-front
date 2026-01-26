import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiCvContent } from '../../../models/cv-content.model';

@Component({
  selector: 'app-cv-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-preview-component.html',
  styleUrl: './cv-preview-component.css'
})
export class CvPreviewComponent {
  @Input() structure: AiCvContent | null = null;
}
