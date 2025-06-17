import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';
interface Player {
  name: string;
  id: string;
}
interface RoomData {
  room_code: string;
  players: Player[];
  status: 'waiting' | 'ready';
}
@Component({
  selector: 'app-game-room',
  imports: [CommonModule],
  templateUrl: './game-room.component.html',
  styleUrl: './game-room.component.css'
})
export class GameRoomComponent implements OnInit, OnDestroy {
  roomCode: string = '';
  currentPlayerName: string = '';
  roomData: RoomData | null = null;
  gameStatus: 'waiting' | 'ready' | 'disconnected' = 'waiting';
  isConnected: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.roomCode = this.route.snapshot.params['roomCode'] || '';
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
        console.log('[GAME-ROOM] Both players ready:', data);
        this.gameStatus = 'ready';
        this.updateRoomData(data);
      }),

      this.socketService.onRoomData().subscribe(data => {
        this.updateRoomData(data);
      }),

      this.socketService.onPlayerDisconnected().subscribe(data => {
        console.log('[GAME-ROOM] Player disconnected:', data);
        this.gameStatus = 'disconnected';
        this.updateRoomData(data);
      }),

      this.socketService.onPlayerLeft().subscribe(data => {
        console.log('[GAME-ROOM] Player left:', data);
        this.updateRoomData(data);
      }),

      this.socketService.onError().subscribe(error => {
        console.error('[GAME-ROOM] Socket error:', error);
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
      room_code: data.room_code || this.roomCode,
      players: data.players || [],
      status: data.status || 'waiting'
    };
    console.log('[GAME-ROOM] Room data updated:', this.roomData);
  }

  private checkConnection(): void {
    this.isConnected = this.socketService.isConnected();

    if (!this.isConnected) {
      console.log('[GAME-ROOM] Connection lost, attempting to reconnect...');
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
      console.log('[GAME-ROOM] Leaving room:', this.roomCode);
      this.socketService.leaveRoom(this.roomCode);
      this.router.navigate(['/']);
    }
  }

}
