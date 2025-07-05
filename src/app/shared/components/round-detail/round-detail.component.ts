import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-round-detail',
  imports: [CommonModule],
  templateUrl: './round-detail.component.html',
  styleUrl: './round-detail.component.css'
})
export class RoundDetailComponent {
  @Input() round = 1;
  @Input() totalRounds = 5;
  @Input() word = '';
  @Input() visible = true;
  @Output() gotIt = new EventEmitter<void>();

  onGotIt() {
    this.visible = false;
    setTimeout(() => this.gotIt.emit(), 500);
  }

}
