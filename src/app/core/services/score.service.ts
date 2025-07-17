import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {
  maxTime: number = 20;

  constructor() { }

  calculateScore(timeTaken: number): number {
    if (timeTaken <= 5) return 100;
    if (timeTaken <= 7) return 90;
    if (timeTaken <= 9) return 80;
    if (timeTaken <= 11) return 70;
    if (timeTaken <= 13) return 60;
    if (timeTaken <= 15) return 50;
    if (timeTaken <= 17) return 40;
    if (timeTaken <= 19) return 30;
    if (timeTaken <= 20) return 20;
    return 0;
  }
}
