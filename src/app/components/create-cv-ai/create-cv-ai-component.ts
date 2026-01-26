import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiCvService, SectionResponse, SectionRequest} from '../../services/ai-cv-service';

@Component({
  selector: 'app-create-cv-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-cv-ai-component.html',
  styleUrls: ['./create-cv-ai-component.css']
})
export class CreateCvAiComponent {
  userInput = '';
  activeSection = 'summary';
  loading = false;

  sections = {
    personalInfo: '',
    summary: '',
    experience: '',
    education: '',
    skills: ''
  };

  chatHistory: Array<{role: string, text: string}> = [
    { role: 'assistant', text: 'Witaj! Wybierz sekcję i opisz co chcesz dodać.' }
  ];

  constructor(private aiService: AiCvService) {}

  selectSection(section: string) {
    this.activeSection = section;
    this.chatHistory = [
      { role: 'assistant', text: `Edytujesz: ${this.getSectionName(section)}. Co chcesz dodać?` }
    ];
  }

  send() {
    if (!this.userInput.trim() || this.loading) return;

    const message = this.userInput.trim();
    this.chatHistory.push({ role: 'user', text: message });
    this.userInput = '';
    this.loading = true;

    const request: SectionRequest = {
      sectionType: this.activeSection,
      currentText: this.sections[this.activeSection as keyof typeof this.sections],
      userMessage: message,
      language: 'PL'
    };

    this.aiService.generate(request).subscribe({
      next: (response: SectionResponse) => {
        this.sections[this.activeSection as keyof typeof this.sections] = response.content;
        this.chatHistory.push({ role: 'assistant', text: response.message });
        this.loading = false;
      },
      error: (err) => {
        this.chatHistory.push({
          role: 'assistant',
          text: 'Wystąpił błąd: ' + (err.error?.message || err.message || 'Nieznany błąd')
        });
        this.loading = false;
      }
    });
  }

  getSectionName(key: string): string {
    const names: any = {
      personalInfo: 'Dane osobowe',
      summary: 'O mnie',
      experience: 'Doświadczenie',
      education: 'Wykształcenie',
      skills: 'Umiejętności'
    };
    return names[key] || key;
  }
}
