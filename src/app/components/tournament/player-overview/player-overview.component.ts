import { Component, Input, OnChanges } from '@angular/core';
import { Player } from 'src/app/shared/models/player.interface';

@Component({
  selector: 'app-player-overview',
  templateUrl: './player-overview.component.html',
  styleUrls: ['./player-overview.component.scss'],
})
export class PlayerOverviewComponent implements OnChanges {
  @Input() players:
    | {
        player: Player;
        position: number;
        rebuys: number;
        addons: number;
      }[]
    | null = null;

  text: string = '';

  percentageIn: number = 0;

  constructor() {}

  ngOnChanges(): void {
    if (this.players) {
      const playersIn = this.players.filter((p) => p.position === 0).length;
      this.text = `${playersIn}`;
      this.percentageIn = (playersIn / this.players.length) * 100;
    }
  }
}
