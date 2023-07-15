import { Component, Input, OnChanges } from '@angular/core';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';

@Component({
    selector: 'app-player-details',
    templateUrl: './player-details.component.html',
    styleUrls: ['./player-details.component.scss']
})
export class PlayerDetailsComponent implements OnChanges {

    @Input() players: Player[];
    @Input() entries: Entry[];

    combination: {
        image: string;
        name: string;
        rebuys: number;
        addons: number;
    }[];

    ngOnChanges(): void {
        if (this.players && this.entries) {
            this.combination = this.players.map(
                (player: Player) => ({
                    image: player.image,
                    name: player.name,
                    rebuys: this.entries.filter(e => e.playerId === player.id && e.type === 'REBUY').length,
                    addons: this.entries.filter(e => e.playerId === player.id && e.type === 'ADDON').length
                })
            );
        }
    }

}
