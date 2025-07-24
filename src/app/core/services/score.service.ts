import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {
  maxTime: number = 20;
  maxScore: number = 100;
  minScore: number = 20;

  constructor() { }

  calculateScore(timeTaken: number): number {
    const cappedTime = Math.min(timeTaken, this.maxTime);
    const timeRatio = cappedTime / this.maxTime;
    const score = this.maxScore - (this.maxScore - this.minScore) * timeRatio;
    return Math.round(score);
  }
}
