import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AiCvService, SectionRequest, SectionResponse } from '../../services/ai-cv-service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

type SectionKey = 'personalInfo' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'interests';

interface CvDraft {
  sections: Record<SectionKey, string>;
  sectionOrder: SectionKey[];
  profilePhoto: string | null;
  activeSection: SectionKey;
  lastModified: number;
}

export interface CvData {
  personalInfo: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  interests: string;
  sectionOrder: SectionKey[];
  profilePhoto: string | null;
}

@Component({
  selector: 'app-cv-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-chat.component.html',
  styleUrl: './cv-chat.component.css'
})
export class CvChatComponent implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'cvDraft';
  private readonly AUTO_SAVE_INTERVAL = 30000;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private routerSubscription: Subscription | null = null;

  userInput = '';
  activeSection: SectionKey = 'personalInfo';
  loading = false;
  profilePhoto: string | null = null;
  photoFile: File | null = null;
  photoError = '';
  isDraggingPhoto = false;

  sections: Record<SectionKey, string> = {
    personalInfo: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    interests: ''
  };

  readonly sectionNames: Record<SectionKey, string> = {
    personalInfo: 'Dane osobowe',
    summary: 'Podsumowanie',
    experience: 'Doświadczenie',
    education: 'Wykształcenie',
    skills: 'Umiejętności',
    projects: 'Projekty',
    interests: 'Zainteresowania'
  };

  sectionKeys: SectionKey[] = [
    'personalInfo',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'interests'
  ];

  chatHistory: ChatMessage[] = [];
  draggedSectionIndex: number | null = null;
  editingSection: SectionKey | null = null;

  constructor(
    private aiService: AiCvService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadSavedData();
    this.startAutoSave();
    this.initializeChat();
    this.setupRouterListener();
  }

  ngOnDestroy(): void {
    this.stopAutoSave();
    this.routerSubscription?.unsubscribe();
  }

  private initializeChat(): void {
    if (this.chatHistory.length === 0) {
      this.chatHistory.push({
        role: 'assistant',
        text: 'Cześć! 👋 Pomogę Ci stworzyć CV. Kliknij sekcję którą chcesz edytować i opisz co chcesz dodać.'
      });
    }
  }

  private setupRouterListener(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadSavedData();
    });
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveData();
    }, this.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  clearActiveSection(): void {
    const sectionName = this.sectionNames[this.activeSection];
    if (confirm(`Czy na pewno chcesz wyczyścić całą treść sekcji "${sectionName}"?`)) {
      this.sections[this.activeSection] = '';
      this.chatHistory.push({
        role: 'assistant',
        text: `Wyczyszczono zawartość sekcji: ${sectionName}. Możemy zacząć od nowa!`
      });
      this.saveData();
    }
  }

  clearSectionByKey(key: SectionKey, event: Event): void {
    event.stopPropagation();
    const sectionName = this.sectionNames[key];
    if (confirm(`Czy na pewno chcesz usunąć treść z sekcji "${sectionName}"?`)) {
      this.sections[key] = '';
      this.saveData();
    }
  }

  clearChatHistory(): void {
    this.chatHistory = [{
      role: 'assistant',
      text: 'Historia czatu została wyczyszczona. W czym mogę Ci teraz pomóc?'
    }];
  }

  clearAllTextContent(): void {
    if (confirm('Czy na pewno chcesz wyczyścić TREŚĆ wszystkich sekcji? Zdjęcie i układ zostaną zachowane.')) {
      this.sectionKeys.forEach(key => {
        this.sections[key] = '';
      });
      this.saveData();
      this.chatHistory.push({
        role: 'assistant',
        text: 'Wyczyszczono całą treść CV. Twoje zdjęcie i układ sekcji pozostały bez zmian.'
      });
    }
  }

  private saveData(): void {
    const cvDraft: CvDraft = {
      sections: { ...this.sections },
      sectionOrder: [...this.sectionKeys],
      profilePhoto: this.profilePhoto,
      activeSection: this.activeSection,
      lastModified: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cvDraft));
    } catch (e) {
      console.error('Błąd zapisu do localStorage:', e);
    }
  }

  private loadSavedData(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (!savedData) return;

    try {
      const draft = JSON.parse(savedData);

      if (draft.sections) {
        const normalizedSections = this.getEmptySections();
        Object.keys(draft.sections).forEach(key => {
          const value = draft.sections[key];
          normalizedSections[key as SectionKey] = typeof value === 'string' ? value : '';
        });
        this.sections = normalizedSections;
      } else {
        this.sections = {
          personalInfo: this.normalizeValue(draft.personalInfo),
          summary: this.normalizeValue(draft.summary),
          experience: this.normalizeValue(draft.experience),
          education: this.normalizeValue(draft.education),
          skills: this.normalizeValue(draft.skills),
          projects: this.normalizeValue(draft.projects),
          interests: this.normalizeValue(draft.interests)
        };
      }

      if (draft.sectionOrder && Array.isArray(draft.sectionOrder)) {
        this.sectionKeys = draft.sectionOrder;
      }

      this.profilePhoto = draft.profilePhoto || null;

      if (draft.activeSection && this.sectionKeys.includes(draft.activeSection)) {
        this.activeSection = draft.activeSection;
      }
    } catch (error) {
      console.error('Błąd wczytywania danych:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      this.sections = this.getEmptySections();
    }
  }

  private normalizeValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
    return String(value);
  }

  private getEmptySections(): Record<SectionKey, string> {
    return {
      personalInfo: '',
      summary: '',
      experience: '',
      education: '',
      skills: '',
      projects: '',
      interests: ''
    };
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processPhotoFile(input.files[0]);
    }
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingPhoto = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processPhotoFile(event.dataTransfer.files[0]);
    }
  }

  onPhotoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingPhoto = true;
  }

  onPhotoDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingPhoto = false;
  }

  private processPhotoFile(file: File): void {
    this.photoError = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.photoError = 'Dozwolone formaty: JPG, PNG, WebP, GIF';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.photoError = 'Maksymalny rozmiar pliku: 5MB';
      return;
    }

    this.photoFile = file;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.resizeImage(result, 400, 400).then(resizedImage => {
          this.profilePhoto = resizedImage;
          this.saveData();
        });
      }
    };
    reader.onerror = () => {
      this.photoError = 'Błąd wczytywania pliku';
    };
    reader.readAsDataURL(file);
  }

  private resizeImage(base64: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = base64;
    });
  }

  removePhoto(): void {
    this.profilePhoto = null;
    this.photoFile = null;
    this.photoError = '';
    this.saveData();
  }

  triggerPhotoUpload(): void {
    const input = document.getElementById('photo-input') as HTMLInputElement;
    input?.click();
  }

  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';
    const formatted = this.formatHtmlContent(html);
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private formatHtmlContent(html: string): string {
    if (!html) return '';

    let formatted = html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');

    if (!formatted.includes('<p>') &&
      !formatted.includes('<div>') &&
      !formatted.includes('<ul>') &&
      !formatted.includes('<ol>')) {
      formatted = `<div>${formatted}</div>`;
    }

    return formatted;
  }

  selectSection(section: SectionKey): void {
    this.activeSection = section;
    this.editingSection = null;
    this.chatHistory = [{
      role: 'assistant',
      text: `Edytujesz: ${this.sectionNames[section]}. Co chcesz dodać?`
    }];
    this.saveData();
  }

  getSectionName(key: SectionKey): string {
    return this.sectionNames[key];
  }

  isSectionActive(section: SectionKey): boolean {
    return this.activeSection === section;
  }

  isSectionCompleted(section: SectionKey): boolean {
    return this.sections[section]?.trim().length > 0;
  }

  startEditing(section: SectionKey, event: Event): void {
    event.stopPropagation();
    this.editingSection = section;
    this.activeSection = section;

    setTimeout(() => {
      const editableDiv = document.querySelector('.section-editor-contenteditable') as HTMLElement;
      if (editableDiv) {
        editableDiv.innerHTML = this.sections[section];
        editableDiv.focus();
        this.moveCursorToEnd(editableDiv);
      }
    }, 10);
  }

  private moveCursorToEnd(element: HTMLElement): void {
    const range = document.createRange();
    const selection = window.getSelection();

    if (element.childNodes.length > 0) {
      const lastNode = this.getLastTextNode(element);
      if (lastNode) {
        const length = lastNode.textContent?.length || 0;
        range.setStart(lastNode, length);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  private getLastTextNode(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }

    const children = node.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
      const result = this.getLastTextNode(children[i]);
      if (result.nodeType === Node.TEXT_NODE) {
        return result;
      }
    }

    return node;
  }

  stopEditing(): void {
    this.editingSection = null;
    this.saveData();
  }

  isEditing(section: SectionKey): boolean {
    return this.editingSection === section;
  }

  onContentEditableInput(section: SectionKey, event: Event): void {
    const target = event.target as HTMLElement;
    this.sections[section] = target.innerHTML;
  }

  onContentEditableBlur(section: SectionKey, event: Event): void {
    const target = event.target as HTMLElement;
    this.sections[section] = target.innerHTML;
    this.saveData();
  }

  onPreviewDragStart(event: DragEvent, index: number): void {
    this.draggedSectionIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onPreviewDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onPreviewDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();

    if (this.draggedSectionIndex === null || this.draggedSectionIndex === dropIndex) {
      this.draggedSectionIndex = null;
      return;
    }

    const newOrder = [...this.sectionKeys];
    const draggedItem = newOrder[this.draggedSectionIndex];

    newOrder.splice(this.draggedSectionIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    this.sectionKeys = newOrder;
    this.draggedSectionIndex = null;
    this.saveData();
  }

  send(): void {
    if (!this.userInput.trim() || this.loading) return;

    const message = this.userInput.trim();
    this.chatHistory.push({ role: 'user', text: message });
    this.userInput = '';
    this.loading = true;

    const request: SectionRequest = {
      sectionType: this.activeSection,
      currentText: this.sections[this.activeSection],
      userMessage: message,
      language: 'PL'
    };

    this.aiService.generate(request).subscribe({
      next: (response: SectionResponse) => {
        let formattedContent = response.content;

        if (!formattedContent.includes('<') && !formattedContent.includes('>')) {
          formattedContent = formattedContent
            .split('\n\n')
            .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
            .join('');
        } else {
          formattedContent = formattedContent.replace(/\n/g, '<br>');
        }

        this.sections[this.activeSection] = formattedContent;
        this.chatHistory.push({ role: 'assistant', text: response.message });
        this.loading = false;
        this.saveData();
        this.scrollToBottom();
      },
      error: (err: HttpErrorResponse) => {
        let errorMessage = 'Wystąpił błąd. Spróbuj ponownie.';

        if (err.status === 401 || err.status === 403) {
          errorMessage = 'Sesja wygasła. Zaloguj się ponownie.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        }

        this.chatHistory.push({
          role: 'assistant',
          text: errorMessage
        });
        this.loading = false;
        this.scrollToBottom();
      }
    });
  }

  goBack(): void {
    this.saveData();
    this.router.navigate(['/']);
  }

  finishCv(): void {
    const cvData: CvData = {
      personalInfo: this.sections.personalInfo,
      summary: this.sections.summary,
      experience: this.sections.experience,
      education: this.sections.education,
      skills: this.sections.skills,
      projects: this.sections.projects,
      interests: this.sections.interests,
      sectionOrder: [...this.sectionKeys],
      profilePhoto: this.profilePhoto
    };

    const cvDraft: CvDraft = {
      sections: { ...this.sections },
      sectionOrder: [...this.sectionKeys],
      profilePhoto: this.profilePhoto,
      activeSection: this.activeSection,
      lastModified: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cvDraft));
    } catch (e) {
      console.error('Błąd zapisu:', e);
    }

    this.router.navigate(['/cv-preview'], {
      state: { cv: cvData }
    });
  }

  canFinish(): boolean {
    return this.sections.personalInfo?.trim().length > 0;
  }

  hasAnyContent(): boolean {
    return this.sectionKeys.some(key => this.sections[key]?.trim().length > 0);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
