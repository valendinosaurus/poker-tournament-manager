import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent {

    @Input() running: boolean;
    @Input() tournament: Tournament;
    @Input() isSimpleTournament: boolean;
    @Input() isRebuyPhaseFinished: boolean;

    isOverlayOpen = false;

    private authService: AuthService = inject(AuthService);
    isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;

    @Output() createPlayer = new EventEmitter<void>();
    @Output() addPlayer = new EventEmitter<void>();
    @Output() addReEntry = new EventEmitter<void>();
    @Output() addRebuy = new EventEmitter<void>();
    @Output() addAddon = new EventEmitter<void>();
    @Output() seatOpen = new EventEmitter<void>();
    @Output() makeDeal = new EventEmitter<void>();
    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();

}
