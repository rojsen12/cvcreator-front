import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CVService } from '../../services/cv-service';
import { CV } from '../../models/cv-model';
import { NavbarComponent } from '../navbar/navbar-component';

@Component({
  selector: 'app-edit-cv',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './edit-cv-component.html',
  styleUrls: ['./edit-cv-component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class EditCvComponent implements OnInit {
  cvForm!: FormGroup;
  selectedTemplate: string = '';
  isEditMode: boolean = false;
  cvId?: string;
  isSaving: boolean = false;
  saveError: string = '';

  currentStep: number = 0;

  languageLevels = ['Basic', 'Intermediate', 'Advanced', 'Native'];

  sections = [
    { id: 'personal', name: 'Dane osobowe', icon: 'pi-user' },
    { id: 'experience', name: 'Doświadczenie', icon: 'pi-briefcase' },
    { id: 'education', name: 'Edukacja', icon: 'pi-book' },
    { id: 'skills', name: 'Umiejętności', icon: 'pi-cog' },
    { id: 'languages', name: 'Języki', icon: 'pi-globe' },
    { id: 'summary', name: 'Podsumowanie', icon: 'pi-check-circle' }
  ];

  constructor(
    private fb: FormBuilder,
    private cvService: CVService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      const id = params['id'] as string;

      if (id) {
        this.isEditMode = true;
        this.cvId = id;
        this.loadCV(id);
      } else {
        this.selectedTemplate = this.cvService.getSelectedTemplate();
        if (!this.selectedTemplate) {
          this.router.navigate(['/create-cv']);
        }
      }
    });
  }

  initForm(): void {
    this.cvForm = this.fb.group({
      templateType: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: [''],
      profilePicture: [''],
      summary: [''],
      experiences: this.fb.array([]),
      educations: this.fb.array([]),
      skills: this.fb.array([]),
      languages: this.fb.array([])
    });
  }

  loadCV(id: string): void {
    this.cvService.getCVById(id).subscribe({
      next: (cv) => {
        this.selectedTemplate = cv.templateType;
        this.patchFormWithCV(cv);
      },
      error: (err) => {
        this.saveError = 'Nie udało się załadować CV';
      }
    });
  }

  patchFormWithCV(cv: CV): void {
    this.cvForm.patchValue({
      templateType: cv.templateType,
      firstName: cv.firstName,
      lastName: cv.lastName,
      email: cv.email,
      phone: cv.phone,
      address: cv.address,
      profilePicture: cv.profilePicture,
      summary: cv.summary
    });

    cv.experiences.forEach(exp => this.addExperience(exp));
    cv.educations.forEach(edu => this.addEducation(edu));
    cv.skills.forEach(skill => this.addSkill(skill));
    cv.languages.forEach(lang => this.addLanguage(lang));
  }

  get progressPercentage(): number {
    return ((this.currentStep + 1) / this.sections.length) * 100;
  }

  get totalSteps(): number {
    return this.sections.length;
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < this.sections.length - 1) {
      this.currentStep++;
      this.scrollToTop();
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.scrollToTop();
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.canProceedToStep(step)) {
      this.currentStep = step;
      this.scrollToTop();
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return this.isPersonalDataValid();
      case 1:
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return true;
    }
  }

  canProceedToStep(step: number): boolean {
    if (step > 0 && !this.isPersonalDataValid()) {
      return false;
    }
    return true;
  }

  isPersonalDataValid(): boolean {
    return this.cvForm.get('firstName')?.valid === true &&
      this.cvForm.get('lastName')?.valid === true &&
      this.cvForm.get('email')?.valid === true &&
      this.cvForm.get('phone')?.valid === true;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isLastStep(): boolean {
    return this.currentStep === this.sections.length - 1;
  }

  isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  get experiences(): FormArray {
    return this.cvForm.get('experiences') as FormArray;
  }

  get educations(): FormArray {
    return this.cvForm.get('educations') as FormArray;
  }

  get skills(): FormArray {
    return this.cvForm.get('skills') as FormArray;
  }

  get languages(): FormArray {
    return this.cvForm.get('languages') as FormArray;
  }

  createExperienceGroup(data?: any): FormGroup {
    return this.fb.group({
      position: [data?.position || '', Validators.required],
      company: [data?.company || '', Validators.required],
      location: [data?.location || ''],
      startDate: [data?.startDate || '', Validators.required],
      endDate: [data?.endDate || ''],
      description: [data?.description || '']
    });
  }

  addExperience(data?: any): void {
    this.experiences.push(this.createExperienceGroup(data));
  }

  removeExperience(index: number): void {
    this.experiences.removeAt(index);
  }

  createEducationGroup(data?: any): FormGroup {
    return this.fb.group({
      degree: [data?.degree || '', Validators.required],
      institution: [data?.institution || '', Validators.required],
      location: [data?.location || ''],
      startDate: [data?.startDate || '', Validators.required],
      endDate: [data?.endDate || ''],
      description: [data?.description || '']
    });
  }

  addEducation(data?: any): void {
    this.educations.push(this.createEducationGroup(data));
  }

  removeEducation(index: number): void {
    this.educations.removeAt(index);
  }

  createSkillControl(skill?: string): FormGroup {
    return this.fb.group({
      name: [skill || '', Validators.required]
    });
  }

  addSkill(skill?: string): void {
    this.skills.push(this.createSkillControl(skill));
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  createLanguageGroup(data?: any): FormGroup {
    return this.fb.group({
      name: [data?.name || '', Validators.required],
      level: [data?.level || 'Basic', Validators.required]
    });
  }

  addLanguage(data?: any): void {
    this.languages.push(this.createLanguageGroup(data));
  }

  removeLanguage(index: number): void {
    this.languages.removeAt(index);
  }

  onSubmit(): void {
    if (this.cvForm.valid) {
      this.isSaving = true;
      this.saveError = '';

      const cvData: CV = {
        ...this.cvForm.value,
        templateType: this.selectedTemplate,
        skills: this.skills.value.map((s: any) => s.name)
      };

      if (this.isEditMode && this.cvId) {
        this.cvService.updateCV(this.cvId, cvData).subscribe({
          next: (response) => {
            this.isSaving = false;
            this.router.navigate(['/preview-cv', response.id]);
          },
          error: (error) => {
            this.isSaving = false;
            this.saveError = 'Nie udało się zaktualizować CV';
          }
        });
      } else {
        this.cvService.createCV(cvData).subscribe({
          next: (response) => {
            this.isSaving = false;
            this.router.navigate(['/preview-cv', response.id]);
          },
          error: (error) => {
            this.isSaving = false;
            this.saveError = 'Nie udało się utworzyć CV';
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.cvForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/create-cv']);
  }
}
