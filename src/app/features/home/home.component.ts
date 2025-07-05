import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameStartCountdownComponent } from '../../shared/components/game-start-countdown/game-start-countdown.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, GameStartCountdownComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  gameStartingCountdown: boolean = false;

  constructor(private router: Router) { }

  startSoloGame() {
    this.gameStartingCountdown = true;
    setTimeout(() => {
      this.gameStartingCountdown = false;
      this.router.navigate(['/solo']);
    }, 3000);
  }

}
