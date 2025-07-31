import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../../core/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-results',
  imports: [CommonModule],
  templateUrl: './game-results.component.html', 
  styleUrl: './game-results.component.css'
})
export class GameResultsComponent implements OnInit, OnDestroy {
  @Input() myName: string = '';
  @Input() myScore: number = 0;
  @Input() opponentName: string = '';
  @Input() opponentScore: number = 0;
  @Input() opponentStatus: string = '';
  @Input() roomCode: string = '';
  @Input() gameAbandoned: boolean = false;
  
  @Output() lobby = new EventEmitter<void>();
  @Output() home = new EventEmitter<void>();
  @Output() restartGame = new EventEmitter<void>(); // New output for game restart

  // Rematch state
  public hasRequestedRematch: boolean = false;
  public opponentRequestedRematch: boolean = false;
  public waitingForRematchResponse: boolean = false;
  public rematchDeclined: boolean = false;
  public showRematchButtons: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    this.setupRematchListeners();
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupRematchListeners() {
    // Listen for rematch requests from opponent
    const rematchRequestSub = this.socketService.onRematchRequested().subscribe(data => {
      console.log('[REMATCH] Opponent requested rematch:', data);
      this.opponentRequestedRematch = true;
      this.showRematchButtons = true;
    });

    // Listen for rematch acceptance
    const rematchAcceptedSub = this.socketService.onRematchAccepted().subscribe(data => {
      console.log('[REMATCH] Rematch accepted:', data);
      this.handleRematchAccepted();
    });

    // Listen for rematch declined
    const rematchDeclinedSub = this.socketService.onRematchDeclined().subscribe(data => {
      console.log('[REMATCH] Rematch declined:', data);
      this.handleRematchDeclined();
    });

    // Listen for waiting state
    const waitingSub = this.socketService.onWaitingForOtherPlayer().subscribe(data => {
      console.log('[REMATCH] Waiting for other player:', data);
      this.waitingForRematchResponse = true;
    });

    this.subscriptions.push(rematchRequestSub, rematchAcceptedSub, rematchDeclinedSub, waitingSub);
  }

  private handleRematchAccepted() {
    // Both players accepted rematch - restart the game
    this.restartGame.emit();
  }

  private handleRematchDeclined() {
    this.rematchDeclined = true;
    this.waitingForRematchResponse = false;
    this.showRematchButtons = false;
    
    // Auto-redirect to lobby after 3 seconds
    setTimeout(() => {
      this.onBackToLobby();
    }, 3000);
  }

  // Rematch actions
  requestRematch() {
    if (this.isOpponentDisconnected) {
      // Can't request rematch if opponent is disconnected
      return;
    }

    console.log('[REMATCH] Requesting rematch for room:', this.roomCode);
    this.hasRequestedRematch = true;
    this.waitingForRematchResponse = true;
    this.showRematchButtons = false;
    this.socketService.requestRematch(this.roomCode);
  }

  acceptRematch() {
    console.log('[REMATCH] Accepting rematch for room:', this.roomCode);
    this.socketService.acceptRematch(this.roomCode);
    this.showRematchButtons = false;
    this.waitingForRematchResponse = true;
  }

  declineRematch() {
    console.log('[REMATCH] Declining rematch for room:', this.roomCode);
    this.socketService.declineRematch(this.roomCode);
    this.showRematchButtons = false;
    
    // Player who declined goes back to home
    setTimeout(() => {
      this.backToHome();
    }, 1000);
  }

  // Existing getters
  get winner(): string {
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

  // Navigation actions
  onBackToLobby() {
    this.lobby.emit();
  }

  backToHome() {
    this.home.emit();
  }
}