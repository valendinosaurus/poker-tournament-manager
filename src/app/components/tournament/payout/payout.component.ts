import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-payout',
  templateUrl: './payout.component.html',
  styleUrls: ['./payout.component.scss'],
})
export class PayoutComponent implements OnInit {
  @Input() payout!: {
    place: number;
    percent: number;
  }[];

  @Input() totalPrizepool: number = 1000;

  constructor() {}

  ngOnInit(): void {
    const totalPercent = this.payout
      .map((p) => p.percent)
      .reduce((sum, current) => sum + current, 0);

    if (totalPercent !== 100) {
      console.log('payout not good');
    }
  }
}
