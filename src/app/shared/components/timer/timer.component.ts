// timer.component.ts
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-timer',
  imports: [],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.css'
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() startRound: boolean = false;
  @Output() timerCompleted = new EventEmitter<void>();

  initialTime: number = 20;
  currentTime: number = 20;
  totalTime: number = 20;
  isRunning: boolean = false;

  private intervalId: any;
  private startTime: number = 0;

  // SVG circle properties
  radius: number = 90;
  circumference: number = 2 * Math.PI * this.radius;

  ngOnInit() {
    this.currentTime = this.initialTime;
    this.totalTime = this.initialTime;
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  ngOnChanges() {
    if (this.startRound && !this.isRunning) {
      this.startTimer();
    }
  }

  get strokeDashoffset(): number {
    const progress = this.currentTime / this.totalTime;
    return this.circumference * (1 - progress);
  }

  private startTimer() {
    this.resetTimer();
    this.isRunning = true;
    this.startTime = Date.now();

    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.totalTime * 1000 - elapsed);

      this.currentTime = remaining / 1000;

      if (remaining <= 0) {
        this.currentTime = 0;
        this.stopTimer();
        this.onTimerComplete();
      }
    }, 16); // ~60fps for smooth animation
  }

  private resetTimer() {
    this.stopTimer();
    this.currentTime = this.initialTime;
    this.totalTime = this.initialTime;
  }

  private stopTimer() {
    this.isRunning = false;
    this.clearTimer();
  }

  private clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private onTimerComplete() {
    this.timerCompleted.emit();
  }

  get displayTime(): string {
    return Math.ceil(this.currentTime).toString();
  }
}