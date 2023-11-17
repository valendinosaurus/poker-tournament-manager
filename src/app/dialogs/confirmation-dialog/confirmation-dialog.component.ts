import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {

    private dialogRef: MatDialogRef<ConfirmationDialogComponent> = inject(MatDialogRef<ConfirmationDialogComponent>);
    data: {
        title: string,
        body: string,
        confirm: string
    } = inject(MAT_DIALOG_DATA);

    confirm(): void {
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
