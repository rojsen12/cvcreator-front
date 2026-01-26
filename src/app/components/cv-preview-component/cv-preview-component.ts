import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DocumentEditService, DocumentEditResponse } from '../../services/document-edit-service';
import { CvPersistenceService } from '../../services/cv-persistance-service';

export type SectionKey = 'personalInfo' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'interests';

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

type TemplateType = 'classic' | 'modern';

interface AiEditMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface SelectionContext {
  sectionKey: SectionKey;
  selectedText: string;
  beforeText: string;
  afterText: string;
  fullSectionText: string;
}

interface EditHistoryEntry {
  sectionKey: SectionKey;
  previousValue: string;
  timestamp: number;
}

@Component({
  selector: 'app-cv-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-preview-component.html',
  styleUrl: './cv-preview-component.css'
})
export class CvPreviewComponent implements OnInit, OnDestroy {
  cvData: CvData | null = null;
  safeSections: Partial<Record<SectionKey, SafeHtml>> = {};
  readonly modernMainSections: SectionKey[] = ['summary', 'experience', 'education', 'projects'];

  selectedTemplate: TemplateType = 'classic';
  isExporting = false;
  isSaving = false;
  exportProgress = 0;

  isAiPanelOpen = false;
  aiMessages: AiEditMessage[] = [];
  aiUserInput = '';
  isAiProcessing = false;
  selectionContext: SelectionContext | null = null;
  activeEditSection: SectionKey | null = null;

  private editHistory: EditHistoryEntry[] = [];
  private boundHandleMouseUp: (event: MouseEvent) => void;

  readonly sectionNames: Record<SectionKey, string> = {
    personalInfo: 'Dane osobowe',
    summary: 'Podsumowanie',
    experience: 'Doświadczenie',
    education: 'Wykształcenie',
    skills: 'Umiejętności',
    projects: 'Projekty',
    interests: 'Zainteresowania'
  };

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private documentEditService: DocumentEditService,
    private cvPersistenceService: CvPersistenceService,
    private cdr: ChangeDetectorRef
  ) {
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['cv']) {
      this.cvData = navigation.extras.state['cv'];
    }
  }

  ngOnInit(): void {
    if (!this.cvData) this.loadFromLocalStorage();

    if (!this.cvData || !this.cvData.personalInfo) {
      setTimeout(() => this.router.navigate(['/cv-chat']), 2000);
      return;
    }

    this.refreshAllSafeSections();
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.saveToLocalStorage();
  }

  private refreshAllSafeSections(): void {
    if (!this.cvData) return;
    (Object.keys(this.sectionNames) as SectionKey[]).forEach(key => {
      this.safeSections[key] = this.sanitizer.bypassSecurityTrustHtml(this.cvData![key] || '');
    });
  }

  saveToDatabase(): void {
    if (!this.cvData) return;
    this.isSaving = true;
    this.cvPersistenceService.saveCv(this.cvData).subscribe({
      next: () => {
        alert('CV zostało zapisane w Twoim profilu!');
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Błąd zapisu. Sprawdź czy jesteś zalogowany.');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleMouseUp(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.ai-panel') || target.closest('.toolbar')) return;
    setTimeout(() => this.processSelection(), 50);
  }

  private processSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) return;

    const anchorNode = selection.anchorNode;
    const targetElement = anchorNode?.nodeType === Node.TEXT_NODE
      ? anchorNode.parentElement
      : anchorNode as HTMLElement;

    const editableElement = targetElement?.closest('.editable-section');
    if (!editableElement) return;

    const sectionKey = editableElement.getAttribute('data-section') as SectionKey;
    if (!sectionKey || !this.cvData) return;

    const fullHtml = this.cvData[sectionKey];
    const position = this.findPositionInHtml(fullHtml, selectedText);

    if (position) {
      this.selectionContext = {
        sectionKey,
        selectedText,
        beforeText: fullHtml.substring(0, position.start),
        afterText: fullHtml.substring(position.end),
        fullSectionText: fullHtml
      };
      this.cdr.detectChanges();
    }
  }

  private findPositionInHtml(html: string, searchText: string): { start: number, end: number } | null {
    const simpleIdx = html.indexOf(searchText);
    if (simpleIdx !== -1) return { start: simpleIdx, end: simpleIdx + searchText.length };

    const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escapedSearch.split('').map(char => char.match(/\s/) ? '\\s+' : char).join('(?:<[^>]+>)*');

    try {
      const regex = new RegExp(pattern, 'i');
      const match = html.match(regex);
      if (match && match.index !== undefined) return { start: match.index, end: match.index + match[0].length };
    } catch (e) { return null; }
    return null;
  }

  hasSelection(): boolean {
    return this.selectionContext !== null;
  }

  openAiPanel(): void {
    if (!this.selectionContext) return;
    this.isAiPanelOpen = true;
    this.activeEditSection = this.selectionContext.sectionKey;
    this.aiMessages = [{ role: 'assistant', text: `Co chcesz zrobić z zaznaczonym tekstem?` }];
    this.cdr.detectChanges();
  }

  closeAiPanel(): void {
    this.isAiPanelOpen = false;
    this.selectionContext = null;
    this.activeEditSection = null;
    this.cdr.detectChanges();
  }

  sendAiEdit(): void {
    if (!this.aiUserInput.trim() || !this.selectionContext || this.isAiProcessing) return;

    const userMessage = this.aiUserInput.trim();
    this.aiMessages.push({ role: 'user', text: userMessage });
    this.isAiProcessing = true;
    this.cdr.detectChanges();

    this.documentEditService.editDocument({
      currentDocument: this.selectionContext.selectedText,
      userPrompt: `[FORMATOWANIE] ${userMessage}`
    }).subscribe({
      next: (response: DocumentEditResponse) => {
        const parsed = this.documentEditService.parseResponse(response);
        this.aiMessages.push({ role: 'assistant', text: parsed.message });
        if (parsed.success) {
          this.applyEditedText(parsed.document);
          this.aiUserInput = '';
        }
        this.isAiProcessing = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.aiMessages.push({ role: 'assistant', text: 'Błąd połączenia z AI.' });
        this.isAiProcessing = false;
        this.cdr.detectChanges();
      }
    });
  }

  private applyEditedText(editedText: string): void {
    if (!this.selectionContext || !this.cvData) return;
    const { sectionKey, beforeText, afterText } = this.selectionContext;

    this.editHistory.push({ sectionKey, previousValue: this.cvData[sectionKey], timestamp: Date.now() });
    const newFullText = beforeText + editedText + afterText;
    this.cvData[sectionKey] = newFullText;
    this.safeSections[sectionKey] = this.sanitizer.bypassSecurityTrustHtml(newFullText);

    this.selectionContext = { ...this.selectionContext, selectedText: editedText, fullSectionText: newFullText };
    this.saveToLocalStorage();
    this.cdr.detectChanges();
  }

  undoLastEdit(): void {
    if (this.editHistory.length === 0 || !this.cvData) return;
    const last = this.editHistory.pop()!;
    this.cvData[last.sectionKey] = last.previousValue;
    this.safeSections[last.sectionKey] = this.sanitizer.bypassSecurityTrustHtml(last.previousValue);
    this.selectionContext = null;
    this.cdr.detectChanges();
  }

  canUndo(): boolean {
    return this.editHistory.length > 0;
  }

  onAiInputKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendAiEdit();
    }
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('cvDraft');
    if (saved) {
      const draft = JSON.parse(saved);
      const s = draft.sections || draft;
      this.cvData = {
        personalInfo: s.personalInfo || '',
        summary: s.summary || '',
        experience: s.experience || '',
        education: s.education || '',
        skills: s.skills || '',
        projects: s.projects || '',
        interests: s.interests || '',
        sectionOrder: draft.sectionOrder || ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'interests'],
        profilePhoto: draft.profilePhoto || null
      };
    }
  }

  private saveToLocalStorage(): void {
    if (!this.cvData) return;
    localStorage.setItem('cvDraft', JSON.stringify({
      sections: this.cvData,
      sectionOrder: this.cvData.sectionOrder,
      profilePhoto: this.cvData.profilePhoto
    }));
  }

  goBack(): void {
    this.router.navigate(['/cv-chat']);
  }

  selectTemplate(template: TemplateType): void {
    this.selectedTemplate = template;
  }

  hasContent(section: SectionKey): boolean {
    return !!(this.cvData && this.cvData[section]?.trim().length > 0);
  }

  getProfilePhoto(): string {
    return this.cvData?.profilePhoto || '';
  }

  async exportToPDF(): Promise<void> {
    this.isExporting = true;
    try {
      const cvElement = document.querySelector('.cv-document') as HTMLElement;
      const canvas = await html2canvas(cvElement, { scale: 2, useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
      pdf.save(`CV_${this.selectedTemplate}.pdf`);
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }

  print(): void {
    window.print();
  }
}
