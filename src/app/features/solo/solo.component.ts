import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { TimerComponent } from '../../shared/components/timer/timer.component';
import { GameService } from '../../core/services/game.service';
import { RoundDetailComponent } from '../../shared/components/round-detail/round-detail.component';
import { GameStatsComponent } from '../../shared/components/game-stats/game-stats.component';

@Component({
  selector: 'app-drawing-canvas',
  imports: [CommonModule, TimerComponent, RoundDetailComponent, GameStatsComponent],
  templateUrl: './solo.component.html',
  styleUrls: ['./solo.component.css']
})
export class SoloComponent {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private predictionTimeout: any;
  private roundInProgress = true;

  public predictions: any[] = [];
  public isLoading = false;
  public lastPredictionTime = 0;

  public wordsToDraw: any[] = [];
  public currentRound = 1;
  public totalRounds = 5;
  public currentWord = '';
  public showPrompt = true;
  public startTimer = false;
  public showTimeUp = false;
  public showGameStats = false;
  public gameStats: any = {
    totalRounds: 0,
    correctGuesses: 0,
    rounds: []
  };

  constructor(private gameService: GameService, private location: Location) { }

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 600;
    canvas.height = 450;
    this.ctx = canvas.getContext('2d')!;
    this.clearCanvas();
    this.getWordsToDraw();
  }

  getWordsToDraw(): void {
    this.gameService.getWords().subscribe({
      next: (res: any) => {
        this.wordsToDraw = res.rounds || [];
        this.totalRounds = this.wordsToDraw.length;
        this.currentWord = this.wordsToDraw[0]?.word || '';
        this.gameStats.totalRounds = this.totalRounds;
        this.roundInProgress = true;
      }
    });
  }

  onGotIt() {
    this.showPrompt = false;
    this.restartTimer();
  }

  onTimerComplete() {
    if (!this.roundInProgress) return;
    this.roundInProgress = false;
    this.startTimer = false;
    this.showTimeUp = true;

    this.recordRoundResult(false, true);

    setTimeout(() => {
      this.showTimeUp = false;
      this.proceedToNextRound();
    }, 2000);
  }

  private recordRoundResult(isCorrect: boolean, isTimeUp: boolean = false) {
    const roundResult = {
      round: this.currentRound,
      word: this.currentWord,
      isCorrect: isCorrect,
      isTimeUp: isTimeUp,
      prediction: this.predictions.length > 0 ? this.predictions[0].label : null
    };

    this.gameStats.rounds.push(roundResult);
    if (isCorrect) {
      this.gameStats.correctGuesses++;
    }
  }

  private proceedToNextRound() {
    this.currentRound++;

    if (this.currentRound <= this.totalRounds) {
      this.currentWord = this.wordsToDraw[this.currentRound - 1]?.word || '';
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

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.ctx.beginPath();
    this.predictions = [];
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

  private checkIfCorrectPrediction(predictedLabel: string) {
    if (!this.roundInProgress) return;

    if (predictedLabel.toLowerCase() === this.currentWord.toLowerCase()) {
      this.roundInProgress = false;
      this.recordRoundResult(true);
      this.startTimer = false;

      setTimeout(() => {
        this.proceedToNextRound();
      }, 1500);
    }
  }

  private hasDrawing(): boolean {
    const canvas = this.canvasRef.nativeElement;
    const data = this.ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) return true;
    }
    return false;
  }

  private restartTimer() {
    this.startTimer = false;
    setTimeout(() => {
      this.startTimer = true;
    }, 50);
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
    this.getWordsToDraw();
  }

  onQuitFromStats() {
    this.location.back();
  }

  ngOnDestroy() {
    if (this.predictionTimeout) clearTimeout(this.predictionTimeout);
  }

  quitGame() {
    if (confirm('Are you sure you want to quit the game?')) {
      this.location.back();
    }
  }
}