import { SocketService } from '../../../core/services/socket.service';
import { PlayerService } from '../services/player.service';
import { GameStartCountdownComponent } from '../../../shared/components/game-start-countdown/game-start-countdown.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface Player {
  name: string;
  id: string;
}

interface RoomData {
  creator: string;
  room_code: string;
  players: Player[];
  status: 'waiting' | 'ready' | 'in_progress' | 'finished' | 'post_game' | 'abandoned';
}

@Component({
  selector: 'app-game-room',
  imports: [CommonModule, GameStartCountdownComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css'
})
export class LobbyComponent implements OnInit, OnDestroy {
  roomCode: string = '';
  currentPlayerName: string = '';
  roomData: RoomData | null = null;
  gameStatus: 'waiting' | 'ready' | 'disconnected' = 'waiting';
  isConnected: boolean = true;
  gameStartingCountdown: boolean = false;

  // Enhanced state management
  waitingForReturn: boolean = false;
  waitingMessage: string = '';
  countdownTime: number = 0;
  showGameAbandoned: boolean = false;
  abandonedMessage: string = '';

  private subscriptions: Subscription[] = [];
  private countdownInterval?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private playerService: PlayerService
  ) { }

  ngOnInit() {
    this.roomCode = this.route.snapshot.params['roomCode'] || '';
    this.currentPlayerName = this.playerService.getCurrentPlayerName();

    this.subscriptions.push(
      this.playerService.currentPlayerName$.subscribe(name => {
        this.currentPlayerName = name;
        console.log('[LOBBY] Player name updated:', name);
      })
    );

    this.checkConnection();
    this.setupEventListeners();
    this.socketService.getRoomData(this.roomCode);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearCountdownInterval();
  }

  private setupEventListeners(): void {
    this.subscriptions.push(
      // Existing listeners
      this.socketService.onRoomJoined().subscribe(data => {
        this.updateRoomData(data);
        this.resetStatusFlags();
      }),

      this.socketService.onBothPlayersReady().subscribe(data => {
        console.log('[LOBBY] Both players ready:', data);
        this.gameStatus = 'ready';
        this.updateRoomData(data);
        this.resetStatusFlags();
      }),

      this.socketService.onRoomData().subscribe(data => {
        this.updateRoomData(data);
        // Don't reset flags here as room data is fetched periodically
      }),

      this.socketService.onPlayerDisconnected().subscribe(data => {
        console.log('[LOBBY] Player disconnected:', data);
        this.gameStatus = 'disconnected';
        this.socketService.getRoomData(this.roomCode); // Refresh room data
      }),

      this.socketService.onPlayerLeft().subscribe(data => {
        console.log('[LOBBY] Player left:', data);
        this.updateRoomData(data);
        this.resetStatusFlags();
      }),

      this.socketService.onGameStart().subscribe(() => {
        this.gameStartingCountdown = true;
        setTimeout(() => {
          this.gameStartingCountdown = false;
          this.router.navigate(['/multiplayer/game', this.roomCode]);
        }, 3000);
      }),

      this.socketService.onCreatorChanged().subscribe(data => {
        console.log('[LOBBY] Creator changed to:', data.new_creator);
        if (this.roomData) {
          this.roomData.creator = data.new_creator;
        }
      }),

      // New enhanced listeners
      this.socketService.onGameAbandoned().subscribe(data => {
        console.log('[LOBBY] Game was abandoned:', data);
        this.showGameAbandoned = true;
        this.abandonedMessage = data.message || 'Your opponent left the game. You win!';

        // Auto-hide after 5 seconds
        setTimeout(() => {
          this.showGameAbandoned = false;
        }, 5000);
      }),

      this.socketService.onWaitingForOtherPlayer().subscribe(data => {
        console.log('[LOBBY] Waiting for other player:', data);
        this.waitingForReturn = true;
        this.waitingMessage = 'Waiting for other player to return to lobby...';
        this.countdownTime = data.remaining_time || 15;
        this.startCountdown();
      }),

      this.socketService.onBothReturnedToLobby().subscribe(() => {
        console.log('[LOBBY] Both players returned to lobby');
        this.resetStatusFlags();
        this.socketService.getRoomData(this.roomCode); // Refresh room data
      }),

      this.socketService.onForcedReturnToLobby().subscribe(data => {
        console.log('[LOBBY] Forced return to lobby:', data);
        this.resetStatusFlags();
        this.socketService.getRoomData(this.roomCode); // Refresh room data
      }),

      this.socketService.onReturnedToLobby().subscribe(() => {
        console.log('[LOBBY] Returned to lobby');
        this.resetStatusFlags();
        this.socketService.getRoomData(this.roomCode); // Refresh room data
      }),

      this.socketService.onError().subscribe(error => {
        console.error('[LOBBY] Socket error:', error);
        alert(error.message || 'An error occurred');

        if (error.message?.includes('Room not found') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('Room does not exist')) {
          this.router.navigate(['/']);
        }
      })
    );

    // Connection check interval
    setInterval(() => {
      this.checkConnection();
    }, 3000);
  }

  private updateRoomData(data: any): void {
    const previousStatus = this.roomData?.status;

    this.roomData = {
      creator: data.creator || 'Unknown',
      room_code: data.room_code || this.roomCode,
      players: data.players || [],
      status: data.status || 'waiting'
    };

    console.log('[LOBBY] Room data updated:', this.roomData);

    // Handle status changes
    if (previousStatus && previousStatus !== this.roomData.status) {
      this.handleStatusChange(previousStatus, this.roomData.status);
    }
  }

  private handleStatusChange(oldStatus: string, newStatus: string): void {
    console.log('[LOBBY] Status changed from', oldStatus, 'to', newStatus);

    if (newStatus === 'waiting' || newStatus === 'ready') {
      this.resetStatusFlags();
    }
  }

  private resetStatusFlags(): void {
    this.waitingForReturn = false;
    this.waitingMessage = '';
    this.showGameAbandoned = false;
    this.abandonedMessage = '';
    this.clearCountdownInterval();
  }

  private startCountdown(): void {
    this.clearCountdownInterval();

    this.countdownInterval = setInterval(() => {
      this.countdownTime--;
      if (this.countdownTime <= 0) {
        this.clearCountdownInterval();
        this.waitingForReturn = false;
      }
    }, 1000);
  }

  private clearCountdownInterval(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    this.countdownTime = 0;
  }

  private checkConnection(): void {
    this.isConnected = this.socketService.isConnected();
    if (!this.isConnected) {
      console.log('[LOBBY] Connection lost, attempting to reconnect...');
      this.socketService.reconnect();
    }
  }

  // UI Helper Methods
  getRoomStatusText(): string {
    switch (this.roomData?.status) {
      case 'waiting': return 'Waiting for players';
      case 'ready': return 'Ready to start';
      case 'in_progress': return 'Game in progress';
      case 'finished': return 'Game finished';
      case 'post_game': return 'Returning to lobby';
      case 'abandoned': return 'Game abandoned';
      default: return 'Unknown';
    }
  }

  // Action Methods
  copyRoomCode(): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(this.roomCode)
    }
  }

  leaveRoom(): void {
    if (confirm('Are you sure you want to leave this room?')) {
      console.log('[LOBBY] Leaving room:', this.roomCode);
      this.playerService.clearPlayerName();
      this.socketService.leaveRoom(this.roomCode);
      this.router.navigate(['/']);
    }
  }

  startGame(): void {
    if (!this.roomData) {
      alert('Room data not available!');
      return;
    }

    if (!this.canStartGame()) {
      alert('Cannot start game at this time!');
      return;
    }

    if (this.currentPlayerName !== this.roomData.creator) {
      alert('Only the room creator can start the game!');
      return;
    }

    if (this.roomData.players.length < 2) {
      alert('Need at least 2 players to start the game!');
      return;
    }

    console.log('[LOBBY] Starting game...');
    this.socketService.startGame(this.roomCode);
  }

  isCreator(): boolean {
    return this.currentPlayerName === this.roomData?.creator;
  }

  // Helper method to check if current player is the creator
  isCurrentPlayerCreator(): boolean {
    return this.currentPlayerName === this.roomData?.creator && this.getCreatorPlayer()?.name === this.currentPlayerName;
  }

  // Helper method to check if current player is the non-creator
  isCurrentPlayerNonCreator(): boolean {
    const nonCreator = this.getNonCreatorPlayer();
    return nonCreator?.name === this.currentPlayerName && this.currentPlayerName !== this.roomData?.creator;
  }

  // Helper method to get the creator player
  getCreatorPlayer(): Player | null {
    if (!this.roomData?.players) return null;
    return this.roomData.players.find(player => player.name === this.roomData?.creator) || null;
  }

  // Helper method to get the non-creator player
  getNonCreatorPlayer(): Player | null {
    if (!this.roomData?.players) return null;
    return this.roomData.players.find(player => player.name !== this.roomData?.creator) || null;
  }

  // Updated getStartButtonText method
  getStartButtonText(): string {
    if (!this.roomData) return 'Loading...';

    const playerCount = this.roomData.players.length;

    switch (this.roomData.status) {
      case 'post_game':
        return 'Waiting for players to return...';
      case 'waiting':
        return playerCount < 2 ? 'Waiting for Player...' : 'Start Game';
      case 'ready':
        return 'Start Game';
      default:
        return 'Cannot start game';
    }
  }

  // Updated canStartGame method
  canStartGame(): boolean {
    if (!this.roomData || !this.isCreator()) return false;

    return (this.roomData.players.length >= 2) &&
      (this.roomData.status === 'ready' || this.roomData.status === 'waiting');
  }
}