import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-drawing-canvas',
  imports: [CommonModule],
  templateUrl: './play-solo.component.html',
  styleUrls: ['./play-solo.component.css']
})
export class PlaySoloComponent {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private predictionTimeout: any;

  // Live prediction state
  public predictions: any[] = [];
  public isLoading = false;
  public lastPredictionTime = 0;
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 500;
    canvas.height = 500;
    this.ctx = canvas.getContext('2d')!;
    this.clearCanvas();
  }

  startDrawing(event: MouseEvent) {
    this.drawing = true;
    this.draw(event);
  }

  stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath();

    // Trigger prediction when user stops drawing
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

    // Schedule prediction while drawing (throttled)
    this.schedulePrediction(200); // 200ms delay while drawing
  }

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.ctx.beginPath();

    // Clear predictions when canvas is cleared
    this.predictions = [];
  }

  private schedulePrediction(delay: number = 500) {
    // Clear existing timeout
    if (this.predictionTimeout) {
      clearTimeout(this.predictionTimeout);
    }

    // Schedule new prediction
    this.predictionTimeout = setTimeout(() => {
      this.predictLive();
    }, delay);
  }

  private predictLive() {
    // Throttle predictions to avoid too many API calls
    const now = Date.now();
    if (now - this.lastPredictionTime < 300) {
      return;
    }

    // Check if canvas has content
    if (!this.hasDrawing()) {
      this.predictions = [];
      return;
    }

    this.isLoading = true;
    this.lastPredictionTime = now;

    const canvas = this.canvasRef.nativeElement;
    const base64 = canvas.toDataURL('image/png').split(',')[1];

    this.http.post(`${this.apiUrl}/predict`, { image: base64 })
      .subscribe({
        next: (res: any) => {
          this.predictions = res.predictions || [];
          this.isLoading = false;
        },
        error: err => {
          console.error('Prediction error:', err);
          this.isLoading = false;
          this.predictions = [];
        }
      });
  }

  private hasDrawing(): boolean {
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check if there are any non-white pixels
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) {
        return true;
      }
    }
    return false;
  }

  sendToApi() {
    this.predictLive();
  }

  ngOnDestroy() {
    if (this.predictionTimeout) {
      clearTimeout(this.predictionTimeout);
    }
  }
}