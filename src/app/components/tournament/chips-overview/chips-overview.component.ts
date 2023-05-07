import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Tournamnet } from 'src/app/shared/models/tournament.interface';

@Component({
  selector: 'app-chips-overview',
  templateUrl: './chips-overview.component.html',
  styleUrls: ['./chips-overview.component.scss'],
})
export class ChipsOverviewComponent implements OnChanges {
  @Input() tournament: Tournamnet | null = null;

  constructor() {}

  totalChips: number = 0;
  averageStack: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.tournament && this.tournament) {
      this.totalChips =
        this.tournament.players.length * this.tournament.startStack +
        this.tournament.numberOfRebuys +
        this.tournament.stackRebuy +
        this.tournament.numberOfAddons * this.tournament.stackAddon;

      const playersIn = this.tournament.players.filter(
        (p) => p.position === 0
      ).length;

      this.averageStack = Math.floor(this.totalChips / playersIn);
    }
  }
}
