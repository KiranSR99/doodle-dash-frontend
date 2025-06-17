import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';

interface Player {
  name: string;
  id: string;
  isReady?: boolean;
}

interface RoomData {
  room_code: string;
  players: Player[];
  creator: string;
  current_player?: string;
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
    // Get room code from route
    this.roomCode = this.route.snapshot.params['roomCode'] || '';
    console.log('[GAME-ROOM] Room code from route:', this.roomCode);
    

    // Get current player name from navigation state or session storage
    const navigation = this.router.getCurrentNavigation();
    this.currentPlayerName = navigation?.extras?.state?.['playerName'] ||
      sessionStorage.getItem('playerName') ||
      'Unknown Player';

    // Store player name for future reference
    sessionStorage.setItem('playerName', this.currentPlayerName);

    console.log('[GAME-ROOM] Initialized with room:', this.roomCode, 'player:', this.currentPlayerName);

    this.checkConnection();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    console.log('[GAME-ROOM] Component destroyed');
  }

  private setupEventListeners(): void {
    // Monitor connection status
    this.subscriptions.push(
      // Room events
      this.socketService.onRoomJoined().subscribe(data => {
        console.log('[GAME-ROOM] Room joined event:', data);
        this.updateRoomData(data);
      }),

      // Both players ready
      this.socketService.onBothPlayersReady().subscribe(data => {
        console.log('[GAME-ROOM] Both players ready:', data);
        this.gameStatus = 'ready';
        this.updateRoomData(data);
      }),

      // Player disconnected
      this.socketService.onPlayerDisconnected().subscribe(data => {
        console.log('[GAME-ROOM] Player disconnected:', data);
        this.gameStatus = 'disconnected';
        this.updateRoomData(data);
      }),

      // Player left
      this.socketService.onPlayerLeft().subscribe(data => {
        console.log('[GAME-ROOM] Player left:', data);
        this.gameStatus = 'waiting';
        this.updateRoomData(data);
      }),

      // Error handling
      this.socketService.onError().subscribe(error => {
        console.error('[GAME-ROOM] Socket error:', error);
        alert(error.message || 'An error occurred');

        // If room doesn't exist, redirect back
        if (error.message?.includes('Room not found') || error.message?.includes('does not exist')) {
          this.router.navigate(['/']);
        }
      })
    );

    // Check connection status periodically
    setInterval(() => {
      this.checkConnection();
    }, 3000);
  }

  private updateRoomData(data: any): void {
    this.roomData = {
      room_code: data.room_code || this.roomCode,
      players: data.players || [],
      creator: data.creator || this.roomData?.creator || '',
      current_player: data.current_player || this.currentPlayerName
    };

    // Update game status based on player count
    if (this.roomData.players.length === 2) {
      const allReady = this.roomData.players.every(p => p.isReady);
      this.gameStatus = allReady ? 'ready' : 'waiting';
    } else {
      this.gameStatus = 'waiting';
    }

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
      navigator.clipboard.writeText(this.roomCode).then(() => {
        this.showToast('Room code copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy room code:', err);
        this.fallbackCopyRoomCode();
      });
    } else {
      this.fallbackCopyRoomCode();
    }
  }

  private fallbackCopyRoomCode(): void {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = this.roomCode;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showToast('Room code copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
      this.showToast('Failed to copy room code. Please copy manually: ' + this.roomCode);
    }

    document.body.removeChild(textArea);
  }

  leaveRoom(): void {
    if (confirm('Are you sure you want to leave this room?')) {
      console.log('[GAME-ROOM] Leaving room:', this.roomCode);
      this.socketService.leaveRoom(this.roomCode);

      // Clear stored player name
      sessionStorage.removeItem('playerName');

      // Navigate back to home
      this.router.navigate(['/']);
    }
  }

  private showToast(message: string): void {
    // Simple toast notification (you could replace this with a proper toast service)
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}
