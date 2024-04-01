import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { PlayerModel } from '../../../../shared/models/player.interface';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-create-player',
    templateUrl: './create-player.component.html',
    styleUrls: ['./create-player.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, MatDialogModule],
    providers: [
        {provide: MatDialogRef, useValue: {}},
    ]
})
export class CreatePlayerComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: PlayerModel;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private triggerService: TriggerService = inject(TriggerService);

    private dialogRef: MatDialogRef<CreatePlayerComponent> = inject(MatDialogRef<CreatePlayerComponent>);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: undefined,
            name: '',
            image: '',
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('image', 'Image', true, 1000),
        ];
    }

    onSubmit(model: PlayerModel): void {
        this.playerApiService.post$(model).pipe(
            take(1),
            tap(() => {
                if (this.dialogRef && this.dialogRef.close) {
                    this.dialogRef.close();
                } else {
                    this.triggerService.triggerPlayers();
                }

                this.model = {
                    id: undefined,
                    name: '',
                    image: ''
                };

                this.form = new FormGroup({});
                this.initModel();
                this.initFields();
            })
        ).subscribe();
    }

}
