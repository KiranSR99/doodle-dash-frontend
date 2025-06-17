import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleRoomComponent } from './handle-room.component';

describe('HandleRoomComponent', () => {
  let component: HandleRoomComponent;
  let fixture: ComponentFixture<HandleRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
