import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameResultsComponent } from './game-results.component';

describe('GameResultsComponent', () => {
  let component: GameResultsComponent;
  let fixture: ComponentFixture<GameResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
