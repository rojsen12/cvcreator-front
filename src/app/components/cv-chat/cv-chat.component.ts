import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
  sectionType?: string;
  generatedData?: any;
}

interface CvDraft {
  personalInfo?: any;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: any;
  projects?: any[];
  interests?: string[];
  sectionOrder?: string[];
}

@Component({
  selector: 'app-cv-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-chat.component.html',
  styleUrl: './cv-chat.component.css'
})
export class CvChatComponent implements OnInit {

  steps = ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'interests'];
  currentStep = 'personalInfo';
  currentStepIndex = 0;

  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;

  cvDraft: CvDraft = {};

  private apiUrl = 'http://localhost:8080/api/cv-chat';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.addSystemMessage('Cześć! 👋 Pomogę Ci stworzyć profesjonalne CV krok po kroku. Zacznijmy od podstaw - podaj swoje imię, nazwisko i dane kontaktowe (email, telefon, miasto).');
  }

  // ===== KROKI I ETYKIETY =====

  getStepLabel(step: string): string {
    const labels: Record<string, string> = {
      personalInfo: 'Dane osobowe',
      summary: 'Podsumowanie',
      experience: 'Doświadczenie',
      education: 'Wykształcenie',
      skills: 'Umiejętności',
      projects: 'Projekty',
      interests: 'Zainteresowania'
    };
    return labels[step] || step;
  }

  getStepIcon(step: string): string {
    const icons: Record<string, string> = {
      personalInfo: '👤',
      summary: '📝',
      experience: '💼',
      education: '🎓',
      skills: '⚡',
      projects: '🚀',
      interests: '❤️'
    };
    return icons[step] || '📌';
  }

  getStepHint(step: string): string {
    const hints: Record<string, string> = {
      personalInfo: 'Podaj imię, nazwisko, email, telefon, miasto.',
      summary: 'Opisz siebie w kilku zdaniach - kim jesteś zawodowo i co Cię wyróżnia?',
      experience: 'Opisz swoje doświadczenie zawodowe - stanowiska, firmy, daty, obowiązki.',
      education: 'Podaj informacje o wykształceniu - uczelnia, kierunek, stopień, lata nauki.',
      skills: 'Wymień swoje umiejętności techniczne i miękkie.',
      projects: 'Opisz projekty nad którymi pracowałeś - nazwa, opis, technologie.',
      interests: 'Jakie masz zainteresowania i hobby?'
    };
    return hints[step] || '';
  }

  isStepCompleted(step: string): boolean {
    const data = (this.cvDraft as any)[step];
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    return data !== undefined && data !== null;
  }

  isStepActive(step: string): boolean {
    return this.currentStep === step;
  }

  getCompletedStepsCount(): number {
    return this.steps.filter(step => this.isStepCompleted(step)).length;
  }

  // ===== WIADOMOŚCI =====

  addSystemMessage(content: string): void {
    this.messages.push({ type: 'system', content });
    this.scrollToBottom();
  }

  addUserMessage(content: string): void {
    this.messages.push({ type: 'user', content });
    this.scrollToBottom();
  }

  addAiMessage(content: string, sectionType?: string, generatedData?: any): void {
    this.messages.push({
      type: 'ai',
      content,
      sectionType,
      generatedData
    });
    this.scrollToBottom();
  }

  // ===== WYSYŁANIE I GENEROWANIE =====

  sendMessage(): void {
    if (!this.userInput.trim() || this.isLoading) return;

    const input = this.userInput.trim();
    this.userInput = '';

    this.addUserMessage(input);
    this.generateSection(input);
  }

  generateSection(input: string): void {
    this.isLoading = true;

    this.http.post<any>(
      `${this.apiUrl}/generate-section`,
      {
        sectionType: this.currentStep,
        userInput: input,
        language: 'pl'
      },
      { withCredentials: true }
    ).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          this.addAiMessage(
            `Oto moja propozycja dla sekcji "${this.getStepLabel(this.currentStep)}":`,
            response.sectionType,
            response.generatedContent
          );
        } else {
          this.addAiMessage(`Przepraszam, wystąpił problem: ${response.message}. Spróbuj opisać to inaczej.`);
        }
      },
      error: (err) => {
        this.isLoading = false;

        if (err.status === 401 || err.status === 403) {
          this.addAiMessage('Sesja wygasła. Zaloguj się ponownie.');
          this.router.navigate(['/login']);
          return;
        }

        this.addAiMessage('Przepraszam, wystąpił błąd połączenia. Spróbuj ponownie za chwilę.');
        console.error('Error:', err);
      }
    });
  }

  // ===== AKCJE NA SEKCJACH =====

  acceptSection(msg: ChatMessage): void {
    if (!msg.sectionType || !msg.generatedData) return;

    (this.cvDraft as any)[msg.sectionType] = msg.generatedData;
    this.goToNextStep();
  }

  retrySection(): void {
    this.addSystemMessage(`Spróbujmy jeszcze raz. Opisz swoje ${this.getStepLabel(this.currentStep)} w inny sposób.`);
  }

  skipSection(): void {
    this.addSystemMessage(`Pomijam sekcję "${this.getStepLabel(this.currentStep)}". Możesz ją uzupełnić później.`);
    this.goToNextStep();
  }

  // ===== NAWIGACJA - NOWE METODY =====

  goToNextStep(): void {
    const currentIndex = this.steps.indexOf(this.currentStep);

    if (currentIndex < this.steps.length - 1) {
      this.currentStep = this.steps[currentIndex + 1];
      this.currentStepIndex = currentIndex + 1;

      const hints = this.getStepHint(this.currentStep);
      this.addSystemMessage(`Świetnie! ✨ Teraz przejdźmy do: ${this.getStepLabel(this.currentStep)}. ${hints}`);
    } else {
      this.addSystemMessage('🎉 Gratulacje! Twoje CV jest gotowe. Kliknij "Zakończ i zobacz CV" aby zobaczyć efekt końcowy.');
    }
  }

  goToPreviousStep(): void {
    const currentIndex = this.steps.indexOf(this.currentStep);

    if (currentIndex > 0) {
      this.currentStep = this.steps[currentIndex - 1];
      this.currentStepIndex = currentIndex - 1;

      this.addSystemMessage(`Wróciłeś do sekcji: ${this.getStepLabel(this.currentStep)}`);
    }
  }

  jumpToStep(step: string): void {
    const index = this.steps.indexOf(step);

    if (index !== -1) {
      this.currentStep = step;
      this.currentStepIndex = index;
      this.addSystemMessage(`Przeszedłeś do sekcji: ${this.getStepLabel(step)}. ${this.getStepHint(step)}`);
    }
  }

  canGoNext(): boolean {
    return this.currentStepIndex < this.steps.length - 1;
  }

  canGoPrevious(): boolean {
    return this.currentStepIndex > 0;
  }

  isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  // ===== STAN CV =====

  hasAnyData(): boolean {
    return Object.keys(this.cvDraft).some(key => {
      const value = (this.cvDraft as any)[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null;
    });
  }

  canFinish(): boolean {
    return this.cvDraft.personalInfo !== undefined;
  }

  finishCv(): void {
    this.cvDraft.sectionOrder = this.steps.filter(step => this.isStepCompleted(step));

    console.log('Finalne CV:', this.cvDraft);

    localStorage.setItem('cvDraft', JSON.stringify(this.cvDraft));

    this.router.navigate(['/cv-preview'], {
      state: { cv: this.cvDraft }
    });
  }

  // ===== NAWIGACJA =====

  goBack(): void {
    this.router.navigate(['/']);
  }

  // ===== METODY POMOCNICZE DO TYPÓW =====

  isDataArray(data: any): boolean {
    return Array.isArray(data);
  }

  isDataObject(data: any): boolean {
    return typeof data === 'object' && data !== null && !Array.isArray(data);
  }

  asArray(value: unknown): any[] {
    return Array.isArray(value) ? value : [];
  }

  asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    return String(value ?? '');
  }

  getInterests(): string[] {
    return this.cvDraft.interests ?? [];
  }

  // ===== UI HELPERS =====

  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
