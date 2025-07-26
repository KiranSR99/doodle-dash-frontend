import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket.service';
import { TimerComponent } from '../../../shared/components/timer/timer.component';
import { CommonModule, Location } from '@angular/common';
import { RoundDetailComponent } from '../../../shared/components/round-detail/round-detail.component';
import { GameStatsComponent } from '../../../shared/components/game-stats/game-stats.component';
import { GameService } from '../../../core/services/game.service';
import { ScoreService } from '../../../core/services/score.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-game',
  imports: [CommonModule, TimerComponent, RoundDetailComponent, GameStatsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  round: number = 0;
  roomCode: string = '';

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing: boolean = false;
  private predictionTimeout: any;
  private roundInProgress: boolean = true;
  private roundStartTime: number = 0;

  public predictions: any[] = [];
  public isLoading = false;
  public lastPredictionTime = 0;
  public wordsToDraw: any[] = [];
  public currentRound: number = 1;
  public totalRounds = 5;
  public currentWord: string = '';
  public showPrompt: boolean = true;
  public startTimer: boolean = false;
  public showTimeUp: boolean = false;
  public showGameStats: boolean = false;
  public playerScore: number = 0;

  // Player tracking variables
  public myName: string = '';
  public opponentName: string = '';
  public opponentScore: number = 0;
  public myId: string = '';
  public opponentId: string = '';
  public currentPlayerRound: number = 0;
  public opponentRound: number = 0;
  public currentPlayerStatus: string = 'Game in progress...';
  public opponentStatus: string = 'Game in progress...';
  public waitingForOpponent: boolean = false;

  public gameStats: any = {
    totalRounds: 0,
    correctGuesses: 0,
    rounds: []
  };

  constructor(
    private router: Router,
    private socketService: SocketService,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private gameService: GameService,
    private scoreService: ScoreService,
    private playerService: PlayerService
  ) { }

  ngOnInit() {
    this.roomCode = this.activatedRoute.snapshot.params['roomCode'] || '';
    this.myName = this.playerService.getCurrentPlayerName();

    // Get room data to initialize player names
    this.socketService.getRoomData(this.roomCode);

    this.setupSocketListeners();

    const canvas = this.canvasRef.nativeElement;
    canvas.width = 600;
    canvas.height = 450;
    this.ctx = canvas.getContext('2d')!;
    this.clearCanvas();
  }

  private setupSocketListeners() {
    // Listen for room data to get player names
    this.socketService.onRoomData().subscribe(data => {
      console.log('[SOCKET] Room data received:', data);
      this.initializePlayerData(data);
    });

    // Listen for round start
    this.socketService.onRoundStart().subscribe(data => {
      this.currentWord = data.word;
      this.round = data.round;
      this.currentRound = data.round;
    });

    // Listen for player progress updates
    this.socketService.onPlayerProgress().subscribe(data => {
      console.log('[SOCKET] Player progress updated:', data);
      this.updatePlayerProgress(data);
    });

    // Listen for game over
    this.socketService.onGameOver().subscribe(data => {
      console.log('[SOCKET] Game over:', data);
      this.handleGameOver(data);
    });

    // Start the first round
    this.socketService.nextRound(this.roomCode);
  }

  private initializePlayerData(roomData: any) {
    if (!roomData || !roomData.players || roomData.players.length < 2) return;

    const selfName = this.myName;

    // Find current and opponent player based on name
    const currentPlayer = roomData.players.find((p: any) => p.name === selfName);
    const opponentPlayer = roomData.players.find((p: any) => p.name !== selfName);

    if (currentPlayer && opponentPlayer) {
      this.myId = currentPlayer.id;
      this.opponentId = opponentPlayer.id;
      this.opponentName = opponentPlayer.name;
    } else {
      console.warn('[INIT] Could not match players properly.');
    }
  }


  private updatePlayerProgress(progressData: any) {
    const { player_id, player_name, round, total_rounds, score } = progressData;

    if (player_id === this.myId) {
      // Update own progress
      this.playerScore = score;
      this.currentPlayerRound = round;
      this.currentPlayerStatus = round >= total_rounds ? 'Game Completed' : 'Game in progress...';
    } else if (player_id === this.opponentId) {
      // Update opponent's progress
      this.opponentScore = score;
      this.opponentRound = round;
      this.opponentStatus = round >= total_rounds ? 'Game Completed' : 'Game in progress...';

      if (!this.opponentName && player_name) {
        this.opponentName = player_name;
      }
    }
  }

  private handleGameOver(gameOverData: any) {
    if (!gameOverData || !gameOverData.final_scores) return;

    const finalScores = gameOverData.final_scores;

    if (this.myId in finalScores) {
      this.playerScore = finalScores[this.myId].score;
      this.currentPlayerStatus = 'Game Completed';
    }

    if (this.opponentId in finalScores) {
      this.opponentScore = finalScores[this.opponentId].score;
      this.opponentStatus = 'Game Completed';
    }

    // Both players are done if this event is triggered
    this.waitingForOpponent = false;
    this.showGameStats = true;
  }



  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.ctx.beginPath();
    this.predictions = [];
  }

  startDrawing(event: MouseEvent) {
    this.drawing = true;
    this.draw(event);
  }

  stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath();
    this.schedulePrediction();
  }

  draw(event: MouseEvent) {
    if (!this.drawing) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.ctx.lineWidth = 20;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    this.schedulePrediction(200);
  }

  private schedulePrediction(delay: number = 500) {
    if (this.predictionTimeout) clearTimeout(this.predictionTimeout);
    this.predictionTimeout = setTimeout(() => this.predictLive(), delay);
  }

  private predictLive() {
    const now = Date.now();
    if (now - this.lastPredictionTime < 300) return;
    if (!this.hasDrawing()) {
      this.predictions = [];
      return;
    }

    this.isLoading = true;
    this.lastPredictionTime = now;

    const canvas = this.canvasRef.nativeElement;
    const base64 = canvas.toDataURL('image/png').split(',')[1];

    this.gameService.predictDrawing(base64).subscribe({
      next: (res: any) => {
        const top = res.predictions?.[0];
        this.predictions = top ? [top] : [];
        this.isLoading = false;

        if (top && top.confidence >= 0.75) {
          this.checkIfCorrectPrediction(top.label);
        }
      },
      error: err => {
        console.error('Prediction error:', err);
        this.predictions = [];
        this.isLoading = false;
      }
    });
  }

  private hasDrawing(): boolean {
    const canvas = this.canvasRef.nativeElement;
    const data = this.ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) return true;
    }
    return false;
  }

  private checkIfCorrectPrediction(predictedLabel: string) {
    if (!this.roundInProgress) return;

    if (predictedLabel.toLowerCase() === this.currentWord.toLowerCase()) {
      this.roundInProgress = false;
      this.startTimer = false;

      const timeTakenSec = (Date.now() - this.roundStartTime) / 1000;
      const score = this.scoreService.calculateScore(timeTakenSec);

      this.playerScore += score;
      this.socketService.submitScore(this.roomCode, score);

      this.gameStats.rounds.push({
        word: this.currentWord,
        correct: true,
        timeTaken: Math.round(timeTakenSec),
        score: score
      });
      this.gameStats.correctGuesses++;
      this.gameStats.totalRounds++;

      if (this.currentRound === this.totalRounds) {
        // Final round - wait for game over from server
        this.waitingForOpponent = true;
      } else {
        setTimeout(() => this.proceedToNextRound(), 2000);
      }
    }
  }


  private proceedToNextRound() {
    this.currentRound++;

    if (this.currentRound <= this.totalRounds) {
      this.socketService.nextRound(this.roomCode);
      this.showPrompt = true;
      this.clearCanvas();
      this.predictions = [];
      this.roundInProgress = true;
      this.startTimer = false;
      setTimeout(() => {
        this.restartTimer();
      }, 100);
    } else {
      if (this.currentPlayerStatus === 'Game Completed' && this.opponentStatus === 'Game Completed') {
        this.showGameStats = true;
        // setTimeout(() => {
        // }, 1000);
      } else {
        this.waitingForOpponent = true;
      }
    }
  }

  onGotIt() {
    this.showPrompt = false;
    this.roundStartTime = Date.now();
    this.restartTimer();
  }

  private restartTimer() {
    this.startTimer = false;
    setTimeout(() => {
      this.startTimer = true;
    }, 50);
  }

  onTimerComplete() {
    if (!this.roundInProgress) return;

    this.roundInProgress = false;
    this.startTimer = false;
    this.showTimeUp = true;

    this.gameStats.rounds.push({
      word: this.currentWord,
      correct: false,
      timeTaken: this.scoreService.maxTime,
      score: 0
    });
    this.gameStats.totalRounds++;

    setTimeout(() => {
      this.showTimeUp = false;
      if (this.currentRound === this.totalRounds) {
        // Final round - notify server, wait for opponent
        this.socketService.submitScore(this.roomCode, 0);
        this.waitingForOpponent = true;
      } else {
        this.proceedToNextRound();
      }
    }, 2000);
  }


  goToNextRound(): void {
    this.socketService.nextRound(this.roomCode);
  }

  quitGame() {
    if (confirm('Are you sure you want to quit the game?')) {
      this.location.back();
    }
  }

  onPlayAgain() {
    this.currentRound = 1;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.currentPlayerRound = 0;
    this.opponentRound = 0;
    this.currentPlayerStatus = 'Game in progress...';
    this.opponentStatus = 'Game in progress...';
    this.showGameStats = false;
    this.showPrompt = true;
    this.roundInProgress = true;
    this.gameStats = {
      totalRounds: 0,
      correctGuesses: 0,
      rounds: []
    };
    this.clearCanvas();
  }

  onQuitFromStats() {
    this.location.back();
  }
}