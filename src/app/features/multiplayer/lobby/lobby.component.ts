// ... unchanged imports
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
  status: 'waiting' | 'ready';
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

  private subscriptions: Subscription[] = [];

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
  }

  private setupEventListeners(): void {
    this.subscriptions.push(
      this.socketService.onRoomJoined().subscribe(data => {
        this.updateRoomData(data);
      }),

      this.socketService.onBothPlayersReady().subscribe(data => {
        console.log('[LOBBY] Both players ready:', data);
        this.gameStatus = 'ready';
        this.updateRoomData(data);
      }),

      this.socketService.onRoomData().subscribe(data => {
        this.updateRoomData(data);
      }),

      this.socketService.onPlayerDisconnected().subscribe(data => {
        console.log('[LOBBY] Player disconnected:', data);
        this.gameStatus = 'disconnected';
        this.updateRoomData(data);
      }),

      this.socketService.onPlayerLeft().subscribe(data => {
        console.log('[LOBBY] Player left:', data);
        this.updateRoomData(data);
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

      this.socketService.onError().subscribe(error => {
        console.error('[LOBBY] Socket error:', error);
        alert(error.message || 'An error occurred');

        if (error.message?.includes('Room not found') || error.message?.includes('does not exist')) {
          this.router.navigate(['/']);
        }
      })
    );

    setInterval(() => {
      this.checkConnection();
    }, 3000);
  }

  private updateRoomData(data: any): void {
    this.roomData = {
      creator: data.creator || 'Unknown',
      room_code: data.room_code || this.roomCode,
      players: data.players || [],
      status: data.status || 'waiting'
    };
    console.log('[LOBBY] Room data updated:', this.roomData);
  }

  private checkConnection(): void {
    this.isConnected = this.socketService.isConnected();
    if (!this.isConnected) {
      console.log('[LOBBY] Connection lost, attempting to reconnect...');
      this.socketService.reconnect();
    }
  }

  copyRoomCode(): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(this.roomCode);
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

    if (this.currentPlayerName !== this.roomData.creator) {
      alert('Only the room creator can start the game!');
      return;
    }

    if (this.roomData.players.length < 2) {
      alert('Need at least 2 players to start the game!');
      return;
    }

    this.socketService.startGame(this.roomCode);
  }

  isCreator(): boolean {
    return this.currentPlayerName === this.roomData?.creator;
  }
}
