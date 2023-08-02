import { Component, Input } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { Player } from '../../../../shared/models/player.interface';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent {

    @Input() tournament: Tournament | null;
    @Input() seriesMetatdata: SeriesMetadata | null;
    @Input() isSimpleTournament: boolean;
    @Input() playersInTheHole: Player[] | null;

}
