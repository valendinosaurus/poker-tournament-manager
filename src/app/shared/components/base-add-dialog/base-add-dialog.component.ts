import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-base-add-dialog',
    template: '',
    standalone: true,
    imports: [],
})
export class BaseAddDialogComponent<T, K> {

    model: K;

    isLoadingAdd = false;
    isLoadingRemove = false;

    protected dialogRef: MatDialogRef<T> = inject(MatDialogRef<T>);

    closeDialog(event: Event): void {
        event.preventDefault();

        if (this.dialogRef) {
            this.dialogRef.close();
        }
    }
}
