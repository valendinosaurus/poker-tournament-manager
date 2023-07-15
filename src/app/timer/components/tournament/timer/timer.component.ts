import { Component, Input } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { Player } from '../../../../shared/models/player.interface';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent {

    @Input() tournament: Tournament | null;
    @Input() formulaId: number | null;
    @Input() isSimpleTournament: boolean;
    @Input() playersInTheHole: Player[] | null;

}
