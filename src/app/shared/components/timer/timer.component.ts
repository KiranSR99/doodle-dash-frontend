import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-timer',
  imports: [],
  template: `
    <div class="flex flex-col items-center gap-5 font-sans">
    <div class="relative w-10 h-10">
        <svg width="80" height="80" viewBox="0 0 200 200" class="w-full h-full">
            <!-- Background circle -->
            <circle cx="100" cy="100" [attr.r]="radius" fill="none" stroke="#f0f0f0" stroke-width="10" />

            <!-- Progress arc -->
            <circle cx="100" cy="100" [attr.r]="radius" fill="none" stroke="#4a5565" stroke-width="12"
                stroke-linecap="round" [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="strokeDashoffset" transform="rotate(-90 100 100)"
                class="transition-all duration-[16ms] linear" />
        </svg>

        <!-- Timer display -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <span class="text-md text-gray-500">{{ displayTime }}</span>
        </div>
    </div>
</div>
  `,
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
  private previousStartRound: boolean = false;

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
    // Check if startRound changed from false to true
    if (this.startRound && !this.previousStartRound) {
      this.startTimer();
    } else if (!this.startRound && this.previousStartRound) {
      // If startRound becomes false, stop the timer
      this.stopTimer();
    }

    this.previousStartRound = this.startRound;
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