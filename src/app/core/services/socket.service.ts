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

  // === Room Management Emitters ===
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

  getRoomData(roomCode: string) {
    console.log('[SOCKET] Getting room data for:', roomCode);
    this.socket.emit('get_room_data', { room_code: roomCode });
  }

  // === Game Control Emitters ===
  startGame(room_code: string) {
    console.log('[SOCKET] Starting game in room:', room_code);
    this.socket.emit('start_game', { room_code });
  }

  nextRound(room_code: string) {
    console.log('[SOCKET] Requesting next round for room:', room_code);
    this.socket.emit('next_round', { room_code });
  }

  submitScore(room_code: string, score: number) {
    console.log('[SOCKET] Submitting score:', score, 'for room:', room_code);
    this.socket.emit('submit_score', { room_code, score });
  }

  // === Post-Game Emitters ===
  requestRematch(room_code: string) {
    console.log('[SOCKET] Requesting rematch for room:', room_code);
    this.socket.emit('request_rematch', { room_code });
  }

  acceptRematch(room_code: string) {
    console.log('[SOCKET] Accepting rematch for room:', room_code);
    this.socket.emit('accept_rematch', { room_code });
  }

  declineRematch(room_code: string) {
    console.log('[SOCKET] Declining rematch for room:', room_code);
    this.socket.emit('decline_rematch', { room_code });
  }

  returnToLobby(room_code: string) {
    console.log('[SOCKET] Returning to lobby for room:', room_code);
    this.socket.emit('return_to_lobby', { room_code });
  }

  // === Room Management Listeners ===
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
    return this.listenToSocketEvent('room_data');
  }

  onPlayerDisconnected(): Observable<any> {
    return this.listenToSocketEvent('player_disconnected');
  }

  onPlayerLeft(): Observable<any> {
    return this.listenToSocketEvent('player_left');
  }

  onCreatorChanged(): Observable<any> {
    return this.listenToSocketEvent('creator_changed');
  }

  // === Game Flow Listeners ===
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

  // === Mid-Game Disconnection Listeners ===
  onGameAbandoned(): Observable<any> {
    return this.listenToSocketEvent('game_abandoned');
  }

  // === Post-Game Flow Listeners ===
  onRematchRequested(): Observable<any> {
    return this.listenToSocketEvent('rematch_requested');
  }

  onRematchAccepted(): Observable<any> {
    return this.listenToSocketEvent('rematch_accepted');
  }

  onRematchDeclined(): Observable<any> {
    return this.listenToSocketEvent('rematch_declined');
  }

  onWaitingForOtherPlayer(): Observable<any> {
    return this.listenToSocketEvent('waiting_for_other_player');
  }

  onBothReturnedToLobby(): Observable<any> {
    return this.listenToSocketEvent('both_returned_to_lobby');
  }

  onForcedReturnToLobby(): Observable<any> {
    return this.listenToSocketEvent('forced_return_to_lobby');
  }

  onReturnedToLobby(): Observable<any> {
    return this.listenToSocketEvent('returned_to_lobby');
  }

  // === Error Handling ===
  onError(): Observable<any> {
    return this.listenToSocketEvent('error');
  }

  // === Connection Management ===
  disconnect() {
    console.log('[SOCKET] Disconnecting...');
    this.socket.disconnect();
  }

  reconnect() {
    console.log('[SOCKET] Reconnecting...');
    this.socket.connect();
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  getSocketId(): string {
    return this.socket.id || '';
  }

  // === Utility ===
  private listenToSocketEvent(eventName: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.off(eventName); // Prevent duplicate listeners
      this.socket.on(eventName, (data) => {
        console.log(`[SOCKET] ${eventName} event received:`, data);
        observer.next(data);
      });
    });
  }

  // === Cleanup ===
  ngOnDestroy() {
    console.log('[SOCKET] Service destroyed, disconnecting...');
    this.disconnect();
  }
}