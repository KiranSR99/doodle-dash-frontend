// Example of how to use the timer component in your game component

// game.component.ts
import { Component } from '@angular/core';
import { TimerComponent } from '../timer/timer.component';

@Component({
  selector: 'app-test',
  imports: [TimerComponent],
  template: `
    <div class="game-container">
      <h1>Game Round {{ currentRound }}</h1>
      
      <!-- Timer Component -->
      <app-timer 
        [startRound]="roundStarted"
        (timerCompleted)="onRoundCompleted()">
      </app-timer>
      
      <div class="game-controls">
        <button 
          (click)="startNewRound()" 
          [disabled]="roundStarted"
          class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
          Start Round
        </button>
        
        <button 
          (click)="resetGame()"
          class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 ml-4">
          Reset Game
        </button>
      </div>
      
      <div class="game-info mt-4">
        <p>Status: {{ gameStatus }}</p>
        <p>Score: {{ score }}</p>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }
    .game-controls {
      display: flex;
      gap: 10px;
    }
    .game-info {
      text-align: center;
    }
  `]
})
export class TestComponent {
  currentRound: number = 1;
  roundStarted: boolean = false;
  gameStatus: string = 'Ready to start';
  score: number = 0;

  startNewRound() {
    this.roundStarted = true;
    this.gameStatus = `Round ${this.currentRound} in progress...`;

    // Reset the timer trigger after a brief moment
    setTimeout(() => {
      this.roundStarted = false;
    }, 100);
  }

  onRoundCompleted() {
    this.gameStatus = `Round ${this.currentRound} completed!`;
    this.currentRound++;
    this.score += 10; // Example scoring

    // Auto-start next round after 2 seconds (optional)
    setTimeout(() => {
      this.startNewRound();
    }, 2000);
  }

  resetGame() {
    this.currentRound = 1;
    this.roundStarted = false;
    this.gameStatus = 'Ready to start';
    this.score = 0;
  }
}