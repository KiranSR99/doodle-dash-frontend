import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-stats',
  imports: [CommonModule],
  templateUrl: './game-stats.component.html',
  styleUrl: './game-stats.component.css'
})
export class GameStatsComponent {

  @Input() gameStats: any = {
    totalRounds: 0,
    correctGuesses: 0,
    rounds: []
  };

  @Output() playAgain = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();

  getScorePercentage(): number {
    if (this.gameStats.totalRounds === 0) return 0;
    return Math.round((this.gameStats.correctGuesses / this.gameStats.totalRounds) * 100);
  }

  getPerformanceMessage(): string {
    const percentage = this.getScorePercentage();
    if (percentage === 100) return "Perfect! You're a drawing master! 🎨";
    if (percentage >= 80) return "Excellent work! Great drawing skills! 👏";
    if (percentage >= 60) return "Good job! Keep practicing! 👍";
    if (percentage >= 40) return "Not bad! Room for improvement! 💪";
    return "Keep trying! Practice makes perfect! 🎯";
  }

  onPlayAgain() {
    this.playAgain.emit();
  }

  onQuit() {
    this.quit.emit();
  }

}
