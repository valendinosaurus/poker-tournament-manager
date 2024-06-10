import { Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlindStructureApiService } from '../../../core/services/api/blind-structure-api.service';
import { BlindStructure } from '../../../shared/interfaces/blind-structure.interface';
import { Tournament } from '../../../shared/interfaces/tournament.interface';
import { Observable } from 'rxjs';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { map, shareReplay, take, tap } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { BlindLevel } from '../../../shared/interfaces/blind-level.interface';

@Component({
    selector: 'app-assign-blind-structure',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatSelectModule],
    templateUrl: './assign-blind-structure.component.html',
    styleUrls: ['./assign-blind-structure.component.scss']
})
export class AssignBlindStructureComponent {

    private dialogRef: MatDialogRef<AssignBlindStructureComponent> = inject(MatDialogRef<AssignBlindStructureComponent>);
    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    allStructures$: Observable<BlindStructure[]>;

    data: {
        tournament: Tournament;
    } = inject(MAT_DIALOG_DATA);

    model: {
        selectedStructureToAdd: WritableSignal<BlindStructure | undefined>;
        isValid: Signal<boolean>
    };

    ngOnInit(): void {
        this.model = {
            selectedStructureToAdd: signal(undefined),
            isValid: computed(() => this.model.selectedStructureToAdd() !== undefined)
        };

        this.allStructures$ = this.blindStructureApiService.getAll$().pipe(
            map((structures: BlindStructure[]) => structures.filter((structure: BlindStructure) => structure.structure.length > 0)),
            shareReplay(1)
        );
    }

    onSubmit(): void {
        const levels = this.model.selectedStructureToAdd()?.structure;

        if (levels) {
            const blindIds = levels.map((level: BlindLevel) => level.id);
            const positions = levels.map((level: BlindLevel) => level.position);

            this.tournamentApiService.addBlinds$(blindIds, this.data.tournament.id, positions).pipe(
                take(1),
                tap(() => {
                    if (this.dialogRef) {
                        this.dialogRef.close(true);
                    }
                })
            ).subscribe();
        }
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }
}
