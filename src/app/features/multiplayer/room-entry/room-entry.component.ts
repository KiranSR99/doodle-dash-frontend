// room-entry.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../../core/services/socket.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-handle-room',
  imports: [FormsModule],
  templateUrl: './room-entry.component.html',
  styleUrl: './room-entry.component.css'
})
export class RoomEntryComponent implements OnInit, OnDestroy {
  username: string = '';
  roomCode: string = '';
  isCreatingRoom: boolean = false;
  isJoiningRoom: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private playerService: PlayerService,
    private router: Router
  ) { }

  ngOnInit() {
    console.log('[INIT] Socket connected:', this.socketService.isConnected());
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    this.subscriptions.push(
      this.socketService.onRoomCreated().subscribe(data => {
        console.log('[SOCKET] Room created:', data);
        this.isCreatingRoom = false;
        
        // Set player name in service
        this.playerService.setPlayerName(this.username.trim());
        
        this.router.navigate(['/multiplayer/lobby', data.room_code]);
      }),

      this.socketService.onRoomJoined().subscribe(data => {
        console.log('[SOCKET] Joined room:', data);
        this.isJoiningRoom = false;
        
        // Set player name in service
        this.playerService.setPlayerName(this.username.trim());
        
        this.router.navigate(['/multiplayer/lobby', data.room_code]);
      }),

      this.socketService.onError().subscribe(err => {
        console.error('[SOCKET] Error:', err);
        this.isCreatingRoom = false;
        this.isJoiningRoom = false;
        alert(err.message || 'An error occurred');
      })
    );
  }

  createRoom(): void {
    if (!this.validateUsername()) return;
    if (!this.checkConnection()) return;

    this.isCreatingRoom = true;
    this.socketService.createRoom(this.username.trim());
  }

  joinRoom(): void {
    if (!this.validateUsername()) return;
    if (!this.roomCode.trim()) {
      alert('Please enter a room code.');
      return;
    }
    if (!this.checkConnection()) return;

    this.isJoiningRoom = true;
    this.socketService.joinRoom(this.username.trim(), this.roomCode.trim().toUpperCase());
  }

  // === Helpers ===
  private validateUsername(): boolean {
    if (!this.username.trim()) {
      alert('Please enter your username.');
      return false;
    }
    return true;
  }

  private checkConnection(): boolean {
    if (!this.socketService.isConnected()) {
      alert('Not connected to the server. Please refresh the page.');
      return false;
    }
    return true;
  }
}