import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-game-start-countdown',
  imports: [],
  template: `
    @if(count > 0){
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-70 text-white text-6xl font-bold transition-transform duration-300 scale-100">
      {{ count }}
    </div>
    }
  `,
})
export class GameStartCountdownComponent {
  @Output() countdownFinished = new EventEmitter<void>();
  count = 3;
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.count--;
      if (this.count === 0) {
        clearInterval(this.intervalId);
        setTimeout(() => this.countdownFinished.emit(), 500);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}