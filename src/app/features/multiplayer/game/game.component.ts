import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket.service';
import { TimerComponent } from '../../../shared/components/timer/timer.component';
import { CommonModule, Location } from '@angular/common';
import { RoundDetailComponent } from '../../../shared/components/round-detail/round-detail.component';
import { GameStatsComponent } from '../../../shared/components/game-stats/game-stats.component';
import { GameService } from '../../../core/services/game.service';

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
    private gameService: GameService
  ) { }

  ngOnInit() {
    this.roomCode = this.activatedRoute.snapshot.params['roomCode'] || '';

    this.socketService.onRoundStart().subscribe(data => {
      this.currentWord = data.word;
      this.round = data.round;
    });

    this.socketService.nextRound(this.roomCode);

    const canvas = this.canvasRef.nativeElement;
    canvas.width = 600;
    canvas.height = 450;
    this.ctx = canvas.getContext('2d')!;
    this.clearCanvas();
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

  private proceedToNextRound() {
    this.currentRound++;

    if (this.currentRound <= this.totalRounds) {
      this.socketService.nextRound(this.roomCode);
      this.showPrompt = true;
      this.clearCanvas();
      this.predictions = [];
      this.roundInProgress = true;
      // Stop the timer first, then restart it properly
      this.startTimer = false;
      setTimeout(() => {
        this.restartTimer();
      }, 100);
    } else {
      this.showGameStats = true;
    }
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

      setTimeout(() => {
        this.proceedToNextRound();
      }, 1500);
    }
  }

  goToNextRound(): void {
    this.socketService.nextRound(this.roomCode);
  }

  quitGame() {
    if (confirm('Are you sure you want to quit the game?')) {
      this.location.back();
    }
  }

  onGotIt() {
    this.showPrompt = false;
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

    setTimeout(() => {
      this.showTimeUp = false;
      this.proceedToNextRound();
    }, 2000);
  }

  onPlayAgain() {
    this.currentRound = 1;
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
