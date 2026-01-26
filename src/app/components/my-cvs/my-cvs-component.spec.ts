import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCvsComponent } from './my-cvs-component';

describe('MyCvsComponent', () => {
  let component: MyCvsComponent;
  let fixture: ComponentFixture<MyCvsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCvsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCvsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
