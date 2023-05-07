import { Component, Input } from '@angular/core';
import { dummyTourney } from 'src/app/shared/data/dummy-tournament.const';
import { Tournamnet } from 'src/app/shared/models/tournament.interface';

@Component({
  selector: 'app-tournament',
  templateUrl: './tournament.component.html',
  styleUrls: ['./tournament.component.scss'],
})
export class TournamentComponent {
  @Input() tournament: Tournamnet = dummyTourney;
}
