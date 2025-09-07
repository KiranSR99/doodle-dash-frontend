import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../core/services/game.service';

@Component({
  selector: 'app-scratch',
  imports: [CommonModule],
  templateUrl: './scratch.component.html',
  styleUrls: ['./scratch.component.css']
})
export class ScratchComponent {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer', { static: true }) canvasContainerRef!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private predictionTimeout: any;

  public predictions: any[] = [];
  public isLoading = false;
  public lastPredictionTime = 0;
  
  // Available words for the scratch model
  public availableWords: string[] = [
    'butterfly', 'envelope', 'fish', 'flower', 
    'leaf', 'mountain', 'star', 'tree'
  ];
  
  public modelAccuracy = 84; // 84% accuracy

  constructor(private gameService: GameService) { }

  ngOnInit() {
    this.initializeCanvas();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setupCanvasSize();
  }

  private initializeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvasSize();
    this.clearCanvas();
  }

  private setupCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.canvasContainerRef.nativeElement;

    // Get container dimensions and calculate optimal canvas size
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate size based on available space, allowing width to be slightly larger
    const maxWidth = Math.min(containerWidth - 10, 500); // More width allowance
    const maxHeight = Math.min(containerHeight - 10, 450); // Slightly less height constraint
    
    // Use the smaller dimension but allow width to be a bit larger
    const canvasSize = Math.min(maxWidth, maxHeight);
    const canvasWidth = Math.min(maxWidth, canvasSize * 1.1); // Allow 10% more width
    const canvasHeight = canvasSize;
    
    // Set actual canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Set CSS dimensions to match exactly
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // Redraw if canvas already has content
    if (this.ctx) {
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Calculate the scale factors to map mouse coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get mouse position relative to canvas and scale it
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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

    // Use your scratch model prediction endpoint
    this.gameService.predictDrawingScratch(base64).subscribe({
      next: (res: any) => {
        // Get top 3 predictions
        this.predictions = res.predictions?.slice(0, 3) || [];
        this.isLoading = false;
      },
      error: err => {
        console.error('Scratch model prediction error:', err);
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

  getConfidencePercentage(confidence: number): string {
    return (confidence * 100).toFixed(1);
  }

  ngOnDestroy() {
    if (this.predictionTimeout) clearTimeout(this.predictionTimeout);
  }
}