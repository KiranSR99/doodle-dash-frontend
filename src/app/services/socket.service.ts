import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://127.0.0.1:5000', {
      transports: ['websocket'],
    });
  }

  createRoom(name: string) {
    console.log('[SOCKET] Creating room for:', name);
    this.socket.emit('create_room', { name });
  }

  joinRoom(name: string, room_code: string) {
    console.log('[SOCKET] Joining room:', room_code, 'with name:', name);
    this.socket.emit('join_room', { name, room_code });
  }

  leaveRoom(room_code: string) {
    console.log('[SOCKET] Leaving room:', room_code);
    this.socket.emit('leave_room', { room_code });
  }

  onRoomCreated(): Observable<any> {
    return this.listenToSocketEvent('room_created');
  }

  onRoomJoined(): Observable<any> {
    return this.listenToSocketEvent('room_joined');
  }

  onBothPlayersReady(): Observable<any> {
    return this.listenToSocketEvent('both_players_ready');
  }

  onError(): Observable<any> {
    return this.listenToSocketEvent('error');
  }

  onPlayerDisconnected(): Observable<any> {
    return this.listenToSocketEvent('player_disconnected');
  }

  onPlayerLeft(): Observable<any> {
    return this.listenToSocketEvent('player_left');
  }

  // === Utility Methods ===
  disconnect() {
    this.socket.disconnect();
  }

  reconnect() {
    this.socket.connect();
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  private listenToSocketEvent(eventName: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.off(eventName);
      this.socket.on(eventName, (data) => {
        console.log(`[SOCKET] ${eventName} event received:`, data);
        observer.next(data);
      });
    });
  }
}
