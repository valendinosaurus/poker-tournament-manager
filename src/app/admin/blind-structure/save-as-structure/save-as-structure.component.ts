import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlindLevel } from '../../../shared/models/blind-level.interface';
import { BlindStructureApiService } from '../../../core/services/api/blind-structure-api.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
    BlindStructureViewComponent
} from '../../../shared/components/blind-structure-view/blind-structure-view.component';
import { take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-save-as-structure',
    templateUrl: './save-as-structure.component.html',
    styleUrls: ['./save-as-structure.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        BlindStructureViewComponent
    ]
})
export class SaveAsStructureComponent implements OnInit {

    private dialogRef: MatDialogRef<SaveAsStructureComponent> = inject(MatDialogRef<SaveAsStructureComponent>);

    data: {
        structure: BlindLevel[];
    } = inject(MAT_DIALOG_DATA);

    model: {
        name: WritableSignal<string>,
        isValid: Signal<boolean>
    };

    structureToSave: BlindLevel[];

    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);

    ngOnInit(): void {
        this.structureToSave = Object.assign(this.data.structure, []);

        this.model = {
            name: signal(''),
            isValid: computed(() => this.model.name().length > 0)
        };
    }

    onSubmit(): void {
        this.blindStructureApiService.post$({
            id: undefined,
            name: this.model.name(),
            sub: '',
            structure: this.structureToSave,
            locked: false
        }).pipe(
            take(1),
            tap(() => this.dialogRef.close(true))
        ).subscribe();
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }

}
