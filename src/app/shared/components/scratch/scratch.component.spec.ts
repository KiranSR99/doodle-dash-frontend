import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScratchComponent } from './scratch.component';

describe('ScratchComponent', () => {
  let component: ScratchComponent;
  let fixture: ComponentFixture<ScratchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScratchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScratchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
