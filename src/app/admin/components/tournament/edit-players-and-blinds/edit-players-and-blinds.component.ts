import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TournamentDetails } from '../../../../shared/models/tournament-details.interface';

@Component({
    selector: 'app-edit-players-and-blinds',
    templateUrl: './edit-players-and-blinds.component.html',
    styleUrls: ['./edit-players-and-blinds.component.scss']
})
export class EditPlayersAndBlindsComponent implements OnInit {

    private dialogRef: MatDialogRef<EditPlayersAndBlindsComponent> = inject(MatDialogRef<EditPlayersAndBlindsComponent>);

    data: {
        tournament: TournamentDetails;
    } = inject(MAT_DIALOG_DATA);

    ngOnInit(): void {
    }

}
