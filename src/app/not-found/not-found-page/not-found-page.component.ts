import { Component, inject, OnInit } from '@angular/core';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { AuthUtilService } from '../../shared/services/auth-util.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-not-found-page',
    templateUrl: './not-found-page.component.html',
    styleUrls: ['./not-found-page.component.scss'],
    imports: [
        AppHeaderComponent,
        AsyncPipe,
        RouterLink
    ],
    standalone: true
})
export class NotFoundPageComponent implements OnInit {

    user$: Observable<User | undefined | null>;

    private authUtilService: AuthUtilService = inject(AuthUtilService);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
    }
}
