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
import { GameResultsComponent } from '../game-results/game-results.component';

@Component({
  selector: 'app-game',
  imports: [CommonModule, TimerComponent, RoundDetailComponent, GameResultsComponent],
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
  public showGameResults: boolean = false;
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

  // Multiplayer results data
  public player1Data: any = {
    id: '',
    name: '',
    score: 0,
    rounds: []
  };
  public player2Data: any = {
    id: '',
    name: '',
    score: 0,
    rounds: []
  };

  // Track opponent rounds data
  public opponentRounds: any[] = [];

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

      if (this.myId) {
        this.currentPlayerRound = data.round;
      }
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

  private trackOpponentRound(roundData: any) {
    // Track opponent's round performance if available
    if (roundData.player_id === this.opponentId) {
      this.opponentRounds.push({
        word: roundData.word || 'Unknown',
        correct: roundData.correct || false,
        timeTaken: roundData.timeTaken || this.scoreService.maxTime,
        score: roundData.score || 0
      });
    }
  }

  private handleGameOver(gameOverData: any) {
    if (!gameOverData || !gameOverData.final_scores) return;

    const finalScores = gameOverData.final_scores;

    // Update player 1 (current player) data
    if (this.myId in finalScores) {
      this.playerScore = finalScores[this.myId].score;
      this.currentPlayerStatus = 'Game Completed';

      this.player1Data = {
        id: this.myId,
        name: this.myName,
        score: finalScores[this.myId].score,
        rounds: [...this.gameStats.rounds] // Copy your current rounds data
      };
    }

    // Update player 2 (opponent) data
    if (this.opponentId in finalScores) {
      this.opponentScore = finalScores[this.opponentId].score;
      this.opponentStatus = 'Game Completed';

      // Use tracked opponent rounds or create placeholder data
      let opponentRoundsData = this.opponentRounds;
      if (opponentRoundsData.length === 0) {
        // Create placeholder rounds if we don't have opponent data
        opponentRoundsData = Array.from({ length: this.totalRounds }, (_, i) => ({
          word: 'Unknown',
          correct: false,
          timeTaken: this.scoreService.maxTime,
          score: Math.round(finalScores[this.opponentId].score / this.totalRounds) // Estimate score per round
        }));
      }

      this.player2Data = {
        id: this.opponentId,
        name: this.opponentName,
        score: finalScores[this.opponentId].score,
        rounds: opponentRoundsData
      };
    }

    // Show multiplayer results instead of single player stats
    this.showGameResults = true;
    this.showGameStats = false;
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

      setTimeout(() => {
        this.proceedToNextRound();
      }, 1500);
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
      // Game completed - wait for game over from server
      // this.showGameResults = true; // This will be handled by handleGameOver
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

    // Update round (optional visual fix if needed)
    this.currentPlayerRound = this.currentRound;

    setTimeout(() => {
      this.showTimeUp = false;
      this.proceedToNextRound();
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

  // Original single player methods (keep as fallback)
  onPlayAgain() {
    this.resetGame();
  }

  onQuitFromStats() {
    this.location.back();
  }

  // New multiplayer result methods
  onPlayAgainFromResults() {
    this.resetGame();
  }

  onQuitFromResults() {
    this.location.back();
  }

  private resetGame() {
    this.currentRound = 1;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.currentPlayerRound = 0;
    this.opponentRound = 0;
    this.currentPlayerStatus = 'Game in progress...';
    this.opponentStatus = 'Game in progress...';
    this.showGameStats = false;
    this.showGameResults = false;
    this.showPrompt = true;
    this.roundInProgress = true;

    // Reset player data
    this.player1Data = { id: '', name: '', score: 0, rounds: [] };
    this.player2Data = { id: '', name: '', score: 0, rounds: [] };
    this.opponentRounds = [];

    this.gameStats = {
      totalRounds: 0,
      correctGuesses: 0,
      rounds: []
    };
    this.clearCanvas();

    // Start new game
    this.socketService.nextRound(this.roomCode);
  }
}