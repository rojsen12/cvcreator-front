import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvChatComponent } from './cv-chat.component';

describe('CvChatComponent', () => {
  let component: CvChatComponent;
  let fixture: ComponentFixture<CvChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
