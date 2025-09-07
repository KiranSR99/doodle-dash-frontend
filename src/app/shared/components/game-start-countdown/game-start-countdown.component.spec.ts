import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameStartCountdownComponent } from './game-start-countdown.component';

describe('GameStartCountdownComponent', () => {
  let component: GameStartCountdownComponent;
  let fixture: ComponentFixture<GameStartCountdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameStartCountdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameStartCountdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
