import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
    selector: 'app-add-re-entry',
    templateUrl: './add-re-entry.component.html',
    styleUrls: ['./add-re-entry.component.scss']
})
export class AddReEntryComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddReEntryComponent> = inject(MatDialogRef<AddReEntryComponent>);
    data: { tournament: Tournament, isReentry: boolean } = inject(MAT_DIALOG_DATA);

    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        console.log('isss', this.data.isReentry);
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.playerApiService.getAll$(sub).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((players: Player[]) => {
                    console.log('tap', players);
                    console.log(this.data.tournament.players);
                    console.log(this.data.tournament.entries);

                    this.allPlayers = players
                        .filter(
                            player => this.data.tournament.players.map(p => p.id).includes(player.id)
                        )
                        .filter(player => {
                            const finishedIds = this.data.tournament.finishes.map(f => f.playerId);

                            if (this.data.isReentry) {
                                return finishedIds.includes(player.id);
                            } else {
                                return !finishedIds.includes(player.id);
                            }
                        })
                        .filter(player => {
                            console.log('is', this.data.isReentry);
                            if (this.data.isReentry) {
                                const allowed = this.data.tournament.noOfReEntries;
                                const rebuysOfPlayer = this.data.tournament.entries.filter(
                                    (entry: Entry) => entry.playerId === player.id && entry.type === 'RE-ENTRY'
                                ).length;

                                return rebuysOfPlayer < allowed;
                            }

                            const enteredPlayers = this.data.tournament.entries.filter(
                                (entry: Entry) => entry.playerId === player.id && entry.type === 'ENTRY'
                            ).map(e => e.playerId);

                            console.log('entered', enteredPlayers);

                            return !enteredPlayers.includes(player.id);

                        })
                        .map(
                            player => ({
                                label: player.name,
                                value: player.id
                            })
                        );

                    console.log(this.allPlayers);

                    this.initModel();
                    this.initFields();
                })
            ))
        ).subscribe();
    }

    private initModel(): void {
        this.model = {
            playerId: undefined,
            tournamentId: this.data.tournament.id
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers)
        ];
    }

    onSubmit(model: { playerId: number | undefined, tournamentId: number }): void {
        if (model.playerId && model.tournamentId) {
            this.entryApiService.post$({
                id: undefined,
                playerId: model.playerId,
                tournamentId: model.tournamentId,
                type: this.data.isReentry ? 'RE-ENTRY' : 'ENTRY'
            }).pipe(
                take(1),
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            entryId: result.id
                        });
                    }
                })
            ).subscribe();
        }
    }

}
