import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Branding, BrandingModel } from '../../../shared/interfaces/branding.interface';
import { BrandingApiService } from '../../../shared/services/api/branding-api.service';
import { catchError, take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseAddDialogComponent } from '../../../shared/components/base-add-dialog/base-add-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';

@Component({
    selector: 'app-create-branding',
    templateUrl: './create-branding.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
    ]
})
export class CreateBrandingComponent extends BaseAddDialogComponent<CreateBrandingComponent, BrandingModel> implements OnInit {

    data: {
        branding: Branding | null;
    } = inject(MAT_DIALOG_DATA);

    private brandingApiService: BrandingApiService = inject(BrandingApiService);

    ngOnInit(): void {
        this.initModel();
    }

    private initModel(): void {
        this.model = {
            id: signal(this.data?.branding?.id ?? undefined),
            name: signal(this.data?.branding?.name ?? ''),
            logo: signal(this.data?.branding?.logo ?? ''),
            description: signal(this.data?.branding?.description ?? ''),
            locked: signal(this.data?.branding?.locked ?? false),
            isValid: computed(() =>
                this.model.name().length > 0 &&
                this.model.logo().length > 0
            )
        };
    }

    onSubmit(): void {
        this.isLoadingAdd = true;

        const model: Branding = {
            id: this.model.id() ?? -1,
            name: this.model.name(),
            logo: this.model.logo(),
            description: this.model.description(),
            locked: this.model.locked()
        };

        if (this.data?.branding) {
            this.brandingApiService.put$(model).pipe(
                take(1),
                tap(() => {
                    this.dialogRef.close(true);
                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        } else {
            this.brandingApiService.post$(model).pipe(
                take(1),
                tap(() => {
                    this.dialogRef.close(true);
                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
