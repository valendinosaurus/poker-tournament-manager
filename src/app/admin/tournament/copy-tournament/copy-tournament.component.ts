import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../shared/interfaces/tournament.interface';
import { JsonPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: 'app-copy-tournament',
    templateUrl: './copy-tournament.component.html',
    standalone: true,
    imports: [
        NgIf,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        JsonPipe,
        MatCheckboxModule,
        MatButtonModule
    ]
})
export class CopyTournamentComponent implements OnInit {

    private dialogRef: MatDialogRef<CopyTournamentComponent> = inject(MatDialogRef<CopyTournamentComponent>);

    readonly TODAY = new Date();

    data: {
        tournament: Tournament;
    } = inject(MAT_DIALOG_DATA);

    model: {
        newName: WritableSignal<string>,
        newDate: WritableSignal<string>,
        withStructure: WritableSignal<boolean>,
        withPlayers: WritableSignal<boolean>,
        asTest: WritableSignal<boolean>,
        isValid: Signal<boolean>
    };

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private router: Router = inject(Router);

    ngOnInit(): void {
        this.model = {
            newName: signal(`Copy - ${this.data.tournament.name}`),
            newDate: signal(new Date().toISOString()),
            withStructure: signal(false),
            withPlayers: signal(false),
            asTest: signal(true),
            isValid: computed(() =>
                this.model.newName() !== this.data.tournament.name
                && this.model.newDate() !== new Date(this.data.tournament.date).toISOString())
        };
    }

    onSubmit(): void {
        this.tournamentApiService.copyTournament$(
            this.data.tournament,
            this.model.newName(),
            this.model.newDate(),
            this.model.withPlayers(),
            this.model.withStructure(),
            this.model.asTest()
        ).pipe(
            take(1),
            tap(() => this.dialogRef.close(true)),
            tap(() => this.router.navigate(['/admin']))
        ).subscribe();
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }

}
