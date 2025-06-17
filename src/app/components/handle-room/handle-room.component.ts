import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-handle-room',
  imports: [FormsModule],
  templateUrl: './handle-room.component.html',
  styleUrl: './handle-room.component.css'
})
export class HandleRoomComponent implements OnInit, OnDestroy {
  username: string = '';
  roomCode: string = '';
  isCreatingRoom: boolean = false;
  isJoiningRoom: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
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
        this.router.navigate(['/room', data.room_code], {
          state: { playerName: this.username.trim() }
        });
      }),

      this.socketService.onRoomJoined().subscribe(data => {
        console.log('[SOCKET] Joined room:', data);
        this.isJoiningRoom = false;
        this.router.navigate(['/room', data.room_code], {
          state: { playerName: this.username.trim() }
        });
      }),

      this.socketService.onError().subscribe(err => {
        console.error('[SOCKET] Error:', err);
        this.isCreatingRoom = false;
        this.isJoiningRoom = false;
        alert(err.message || 'An error occurred');
      }),

      // this.socketService.onBothPlayersReady().subscribe(data => {
      //   console.log('[SOCKET] Both players ready:', data);
      //   // You can show UI updates or notify user here if needed
      // })
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
