import { Component, inject, OnInit } from '@angular/core';
import { PlayerApiService } from '../../core/services/api/player-api.service';
import { LocationApiService } from '../../core/services/api/location-api.service';
import { BlindLevelApiService } from '../../core/services/api/blind-level-api.service';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private locationApiService: LocationApiService = inject(LocationApiService);
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private tApiService: TournamentApiService = inject(TournamentApiService);

    ngOnInit(): void {
        // this.tApiService.getAll$().subscribe();
        //
        // this.tApiService.get$(0).subscribe();
        //
        // this.tApiService.post$(dummyTourney).subscribe();
        //
        // this.tApiService.put$({
        //     id: 2,
        //     ...dummyTourney
        // }).subscribe();
        //
        // this.tApiService.delete$(3).subscribe();

    }

}
