import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlindStructureApiService } from '../../../core/services/api/blind-structure-api.service';
import { BlindStructure } from '../../../shared/models/blind-structure.interface';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-create-blind-structure',
    templateUrl: './create-blind-structure.component.html',
    styleUrls: ['./create-blind-structure.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, UserImageRoundComponent]
})
export class CreateBlindStructureComponent implements OnInit {

    private dialogRef: MatDialogRef<CreateBlindStructureComponent> = inject(MatDialogRef<CreateBlindStructureComponent>);
    private blindStructrueApiService: BlindStructureApiService = inject(BlindStructureApiService);

    data: {
        structure?: BlindStructure;
    } = inject(MAT_DIALOG_DATA);

    model: {
        name: WritableSignal<string>;
        nameCache: WritableSignal<string>;
        isValid: Signal<boolean>
    };

    ngOnInit(): void {
        this.model = {
            name: signal(this.data?.structure?.name ?? ''),
            nameCache: signal(this.data?.structure?.name ?? ''),
            isValid: computed(() =>
                !(this.model.nameCache() === this.model.name()) && this.model.name().length > 0
            )
        };
    }

    onSubmit(): void {
        if (this.data?.structure) {
            this.blindStructrueApiService.put$({
                ...this.data.structure,
                name: this.model.name()
            }).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        } else {
            this.blindStructrueApiService.post$({
                name: this.model.name(),
                locked: false,
                id: -1,
                structure: [],
                sub: ''
            }).pipe(
                take(1),
                tap(() =>
                    this.dialogRef.close(true))
            ).subscribe();
        }
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }

}
