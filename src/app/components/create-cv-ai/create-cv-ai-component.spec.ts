import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCvAiComponent } from './create-cv-ai-component';

describe('CreateCvAiComponent', () => {
  let component: CreateCvAiComponent;
  let fixture: ComponentFixture<CreateCvAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCvAiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCvAiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
