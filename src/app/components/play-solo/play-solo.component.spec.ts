import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaySoloComponent } from './play-solo.component';

describe('PlaySoloComponent', () => {
  let component: PlaySoloComponent;
  let fixture: ComponentFixture<PlaySoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaySoloComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PlaySoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
