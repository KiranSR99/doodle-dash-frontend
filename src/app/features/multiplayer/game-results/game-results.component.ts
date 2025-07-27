import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-results',
  imports: [CommonModule],
  templateUrl: './game-results.component.html',
  styleUrl: './game-results.component.css'
})
export class GameResultsComponent {
  @Input() myName: string = '';
  @Input() myScore: number = 0;
  @Input() opponentName: string = '';
  @Input() opponentScore: number = 0;
  @Input() opponentStatus: string = '';

  @Output() playAgain = new EventEmitter<void>();
  @Output() home = new EventEmitter<void>();

  get winner(): string {
    // If opponent disconnected, current player wins
    if (this.isOpponentDisconnected) {
      return this.myName || 'You';
    }

    if (this.myScore > this.opponentScore) {
      return this.myName || 'You';
    } else if (this.opponentScore > this.myScore) {
      return this.opponentName || 'Opponent';
    }
    return 'Tie';
  }

  get isWinner(): boolean {
    return this.isOpponentDisconnected || this.myScore > this.opponentScore;
  }

  get isTie(): boolean {
    return !this.isOpponentDisconnected && this.myScore === this.opponentScore;
  }

  get isOpponentDisconnected(): boolean {
    return this.opponentStatus === 'Disconnected';
  }

  get winMessage(): string {
    if (this.isOpponentDisconnected) {
      return '🎉 You Win!';
    } else if (this.isWinner) {
      return '🎉 You Win!';
    } else if (this.isTie) {
      return '🤝 It\'s a Tie!';
    } else {
      return '😔 You Lose!';
    }
  }

  get subMessage(): string {
    if (this.isOpponentDisconnected) {
      return 'Opponent disconnected';
    } else if (this.isTie) {
      return 'Great game!';
    } else {
      return `${this.winner} is the winner!`;
    }
  }

  onPlayAgain() {
    this.playAgain.emit();
  }

  backToHome() {
    this.home.emit();
  }
}