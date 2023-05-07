import { Component, Input, OnChanges } from '@angular/core';
import { Player } from 'src/app/shared/models/player.interface';

@Component({
  selector: 'app-buyin-overview',
  templateUrl: './buyin-overview.component.html',
  styleUrls: ['./buyin-overview.component.scss'],
})
export class BuyinOverviewComponent implements OnChanges {
  @Input() players:
    | {
        player: Player;
        position: number;
        rebuys: number;
        addons: number;
      }[]
    | null = null;

  textEntries = '';
  textRebuys = '';
  textAddons = '';

  constructor() {}

  ngOnChanges(): void {
    if (this.players) {
      const numberOfEntries = this.players.length;
      this.textEntries = `${numberOfEntries}`;

      const numberOfRebuys = this.players
        .map((player) => player.rebuys)
        .reduce((sum, current) => sum + current, 0);
      this.textRebuys = `${numberOfRebuys}`;

      const numberOfAddons = this.players
        .map((player) => player.addons)
        .reduce((sum, current) => sum + current, 0);
      this.textAddons = `${numberOfAddons}`;
    }
  }
}
