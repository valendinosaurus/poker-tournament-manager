import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
    selector: 'app-add-rebuy',
    templateUrl: './add-rebuy.component.html',
    styleUrls: ['./add-rebuy.component.scss']
})
export class AddRebuyComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddRebuyComponent> = inject(MatDialogRef<AddRebuyComponent>);
    data: { tournament: Tournament } = inject(MAT_DIALOG_DATA);

    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.playerApiService.getAll$(sub).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((players: Player[]) => {
                    this.allPlayers = players
                        .filter(
                            player => this.data.tournament.players.map(p => p.id).includes(player.id)
                        )
                        .filter(player => {
                            const finishedIds = this.data.tournament.finishes.map(f => f.playerId);

                            return !finishedIds.includes(player.id);
                        })
                        .filter(player => {
                            const allowed = this.data.tournament.noOfRebuys;
                            const rebuysOfPlayer = this.data.tournament.entries.filter(
                                (entry: Entry) => entry.playerId === player.id && entry.type === 'REBUY'
                            ).length;

                            return rebuysOfPlayer < allowed;
                        })
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
                type: 'REBUY'
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
