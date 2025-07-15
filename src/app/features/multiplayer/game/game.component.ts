import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket.service';
import { TimerComponent } from '../../../shared/components/timer/timer.component';

@Component({
  selector: 'app-game',
  imports: [TimerComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  currentWord: string = '';
  round: number = 0;
  roomCode: string = '';

  constructor(
    private router: Router,
    private socketService: SocketService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.roomCode = this.activatedRoute.snapshot.params['roomCode'] || '';

    this.socketService.onRoundStart().subscribe(data => {
      this.currentWord = data.word;
      this.round = data.round;
    });

    this.socketService.nextRound(this.roomCode);
  }

  goToNextRound(): void {
    this.socketService.nextRound(this.roomCode);

    // this.socketService.onRoundStart().subscribe(data => {
    //   this.currentWord = data.word;
    //   this.round = data.round;
    // });
  }

}
