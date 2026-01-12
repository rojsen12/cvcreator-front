import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NavbarComponent } from '../navbar/navbar-component';
import { CvPreviewComponent } from './cv-preview/cv-preview-component';

import { CvAiState } from './cv-ai-state.model';
import { AiCvService } from '../../services/ai-cv-service';
import { AiCvContent } from '../../models/cv-content.model';

@Component({
  selector: 'app-create-cv-ai',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NavbarComponent,
    CvPreviewComponent
  ],
  templateUrl: './create-cv-ai-component.html',
  styleUrl: './create-cv-ai-component.css'
})
export class CreateCvAiComponent {

  userInput = '';

  state: CvAiState = {
    currentStructure: null,
    previousStructure: null,
    chatHistory: [],
    status: 'idle'
  };

  constructor(private aiCvService: AiCvService) {}

  sendPrompt(): void {
    const trimmedInput = this.userInput.trim();
    if (!trimmedInput) return;

    // 1️⃣ Dodanie wiadomości użytkownika do widoku
    this.state.chatHistory.push({
      role: 'user',
      message: trimmedInput
    });

    this.state.status = 'generating';

    // Zapamiętujemy prompt i czyścimy pole wpisywania
    const promptText = trimmedInput;
    this.userInput = '';

    /**
     * LOGIKA TRYBU:
     * Jeśli nie mamy jeszcze wygenerowanego CV (currentStructure === null),
     * wysyłamy tryb 'GENERATE'. W przeciwnym razie wysyłamy 'IMPROVE'.
     */
    const mode = this.state.currentStructure ? 'IMPROVE' : 'GENERATE';

    // 2️⃣ Przygotowanie payloadu dla Backend (Java)
    const payload = {
      mode: mode,
      language: 'PL',
      prompt: promptText,
      cv: this.state.currentStructure
    };

    // 3️⃣ Komunikacja z serwerem
    this.aiCvService.sendPrompt(payload).subscribe({
      next: (response) => {
        // Zapisujemy poprzedni stan (do ewentualnego "cofnij")
        this.state.previousStructure = this.state.currentStructure;

        // Aktualizujemy podgląd CV nowymi danymi z AI
        this.state.currentStructure = response.cv;

        // Dodajemy informację od asystenta do chatu
        const assistantFeedback = mode === 'GENERATE'
          ? 'Wygenerowałem Twoje CV. Możesz teraz poprosić o konkretne zmiany lub poprawki.'
          : 'Zaktualizowałem treść Twojego CV zgodnie z prośbą.';

        this.state.chatHistory.push({
          role: 'assistant',
          message: assistantFeedback
        });

        this.state.status = 'reviewing';
      },
      error: (err) => {
        console.error('Błąd serwisu AI:', err);

        this.state.chatHistory.push({
          role: 'assistant',
          message: 'Przepraszam, wystąpił problem techniczny podczas generowania danych. Spróbuj ponownie za chwilę.'
        });

        this.state.status = 'idle';
      }
    });
  }

  /**
   * Prosta funkcja do logowania struktury.
   * Tutaj możesz później dodać faktyczne generowanie PDF.
   */
  downloadCv(): void {
    if (!this.state.currentStructure) {
      alert('Najpierw wygeneruj CV!');
      return;
    }

    console.log('Eksportowanie danych do PDF:', this.state.currentStructure);
    // TODO: Wywołanie serwisu PDF
  }
}
