import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { Player } from '../../../../shared/models/player.interface';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';
import { FetchService } from '../../../../core/services/fetch.service';
import { EventApiService } from '../../../../core/services/api/event-api.service';

@Component({
    selector: 'app-add-player',
    templateUrl: './add-player.component.html',
    styleUrls: ['./add-player.component.scss']
})
export class AddPlayerComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number, tournamentId: number };
    modelMulti: { playerIds: number[] | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    data: {
        tournament: Tournament,
        multi: boolean,
        randomId: number
    } = inject(MAT_DIALOG_DATA);

    private dialogRef: MatDialogRef<AddPlayerComponent> = inject(MatDialogRef<AddPlayerComponent>);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: EventApiService = inject(EventApiService);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.playerApiService.getAll$(sub).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((players: Player[]) => {
                    this.allPlayers = players
                        .filter(
                            player => !this.data.tournament.players.map(p => p.id).includes(player.id)
                        )
                        .map(
                            player => ({
                                label: player.name,
                                value: player.id
                            })
                        );

                    this.initModel();
                    this.initFields();
                })
            ))
        ).subscribe();
    }

    private initModel(): void {
        if (this.data.multi) {
            this.modelMulti = {
                playerIds: [],
                tournamentId: this.data.tournament.id
            };
        } else {
            this.model = {
                playerId: -1,
                tournamentId: this.data.tournament.id
            };
        }
    }

    private initFields(): void {
        if (this.data.multi) {
            this.fields = [
                this.formlyFieldService.getDefaultMultiSelectField('playerIds', 'Players', true, this.allPlayers)
            ];
        } else {
            this.fields = [
                this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers)
            ];
        }
    }

    onSubmit(model: { playerId: number, tournamentId: number }, withEntry: boolean): void {
        if (model.playerId > -1 && model.tournamentId) {
            // TODO improve
            if (withEntry) {
                this.tournamentApiService.addPlayer$(model.playerId, model.tournamentId).pipe(
                    switchMap(
                        () => this.entryApiService.post$({
                            id: undefined,
                            playerId: model.playerId,
                            tournamentId: model.tournamentId,
                            type: 'ENTRY'
                        }).pipe(
                            take(1),
                            tap((a) => this.fetchService.trigger()),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.data.tournament.id,
                                clientId: this.data.randomId
                            })),
                            tap((result: any) => {
                                if (this.dialogRef) {
                                    this.dialogRef.close({
                                        entryId: result.id,
                                        playerId: model.playerId
                                    });
                                }
                            })
                        )
                    )
                ).subscribe();
            } else {
                this.tournamentApiService.addPlayer$(model.playerId, model.tournamentId).pipe(
                    take(1),
                    tap((a) => this.fetchService.trigger()),
                    switchMap(() => this.eventApiService.post$({
                        id: null,
                        tId: this.data.tournament.id,
                        clientId: this.data.randomId
                    })),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close({
                                playerId: model.playerId
                            });
                        }
                    })
                ).subscribe();
            }

        }
    }

    onSubmitMulti(model: { playerIds: number[] | undefined, tournamentId: number }, withEntry: boolean): void {
        if (model.playerIds && model.tournamentId) {
            this.tournamentApiService.addPlayers$(model.playerIds, model.tournamentId).pipe(
                take(1),
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            playerIds: model.playerIds
                        });
                    }
                })
            ).subscribe();
        }
    }

}
