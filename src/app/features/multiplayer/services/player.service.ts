// player.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private currentPlayerName = new BehaviorSubject<string>('');
  currentPlayerName$ = this.currentPlayerName.asObservable();

  constructor() { }

  setPlayerName(name: string): void {
    this.currentPlayerName.next(name);
  }

  getCurrentPlayerName(): string {
    return this.currentPlayerName.value;
  }

  clearPlayerName(): void {
    this.currentPlayerName.next('');
  }
}