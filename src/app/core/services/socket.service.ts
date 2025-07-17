import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    this.socket = io(this.apiUrl, {
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

  startGame(room_code: string) {
    this.socket.emit('start_game', { room_code });
  }

  nextRound(room_code: string) {
    this.socket.emit('next_round', { room_code });
  }

  getRoomData(roomCode: string) {
    this.socket.emit('get_room_data', { room_code: roomCode });
  }

  submitScore(room_code: string, score: number) {
    this.socket.emit('submit_score', { room_code, score });
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

  onRoomData(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('room_data', (data) => {
        console.log('[SOCKET] Room data received:', data);
        observer.next(data);
      });
    });
  }

  onGameStart(): Observable<any> {
    return this.listenToSocketEvent('game_started');
  }

  onRoundStart(): Observable<any> {
    return this.listenToSocketEvent('start_round');
  }

  onPlayerProgress(): Observable<any> {
    return this.listenToSocketEvent('player_progress');
  }

  onGameOver(): Observable<any> {
    return this.listenToSocketEvent('game_over');
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
        // console.log(`[SOCKET] ${eventName} event received:`, data);
        observer.next(data);
      });
    });
  }
}
