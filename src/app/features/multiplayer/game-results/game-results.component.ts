import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Player {
  id: string;
  name: string;
  score: number;
  rounds: Array<{
    word: string;
    correct: boolean;
    timeTaken: number;
    score: number;
  }>;
}

@Component({
  selector: 'app-game-results',
  imports: [CommonModule],
  templateUrl: './game-results.component.html',
  styleUrl: './game-results.component.css'
})
export class GameResultsComponent {
  @Input() player1: Player = {
    id: '',
    name: '',
    score: 0,
    rounds: []
  };
  
  @Input() player2: Player = {
    id: '',
    name: '',
    score: 0,
    rounds: []
  };

  @Input() totalRounds: number = 5;
  @Output() playAgain = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();

  getWinner(): Player | null {
    if (this.player1.score > this.player2.score) {
      return this.player1;
    } else if (this.player2.score > this.player1.score) {
      return this.player2;
    }
    return null; // It's a tie
  }

  getWinnerMessage(): string {
    const winner = this.getWinner();
    if (!winner) {
      return "It's a Tie! 🤝";
    }
    return `🎉 ${winner.name} Wins!`;
  }

  getWinnerSubMessage(): string {
    const winner = this.getWinner();
    if (!winner) {
      return "Both players scored equally well!";
    }
    const scoreDiff = Math.abs(this.player1.score - this.player2.score);
    return `Won by ${scoreDiff} points!`;
  }

  getPlayerAccuracy(player: Player): number {
    if (player.rounds.length === 0) return 0;
    const correctRounds = player.rounds.filter(round => round.correct).length;
    return Math.round((correctRounds / player.rounds.length) * 100);
  }

  getPlayerCorrectGuesses(player: Player): number {
    return player.rounds.filter(round => round.correct).length;
  }

  onPlayAgain() {
    this.playAgain.emit();
  }

  onQuit() {
    this.quit.emit();
  }
}