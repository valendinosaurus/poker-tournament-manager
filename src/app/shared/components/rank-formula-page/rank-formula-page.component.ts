import { Component, inject, OnInit } from '@angular/core';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { AuthUtilService } from '../../services/auth-util.service';
import { RankFormula } from '../../interfaces/rank-formula.interface';
import { RankFormulaApiService } from '../../services/api/rank-formula-api.service';
import { shareReplay } from 'rxjs/operators';
import { FormulaToImagePipe } from '../../pipes/formula-to-image.pipe';

@Component({
    selector: 'app-rank-formula-page',
    templateUrl: './rank-formula-page.component.html',
    styleUrl: './rank-formula-page.component.scss',
    standalone: true,
    imports: [
        AppHeaderComponent,
        AsyncPipe,
        FormulaToImagePipe
    ]
})
export class RankFormulaPageComponent implements OnInit {

    user$: Observable<User | undefined | null>;
    formulas$: Observable<RankFormula[]>;

    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private rankFormulaApiService: RankFormulaApiService = inject(RankFormulaApiService);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.formulas$ = this.rankFormulaApiService.getAll$().pipe(
            shareReplay(1)
        );
    }

}
