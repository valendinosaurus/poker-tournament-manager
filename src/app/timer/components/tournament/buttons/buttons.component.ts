import { Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent implements OnInit {

    @Input() running: boolean;
    @Input() tournament: Tournament;
    @Input() isSimpleTournament: boolean;
    @Input() isRebuyPhaseFinished: boolean;

    isOverlayOpen = false;
    isFullscreen = false;
    elem: HTMLElement;

    private authService: AuthService = inject(AuthService);
    private document: Document = inject(DOCUMENT);

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
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullscreenmodes(event: Event) {
        this.chkScreenMode();
    }

    ngOnInit(): void {
        this.elem = this.document.documentElement;
    }

    chkScreenMode() {
        if (this.document.fullscreenElement) {
            this.isFullscreen = true;
        } else {
            this.isFullscreen = false;
        }
    }

    fullscreen(): void {
            if (this.elem.requestFullscreen) {
                this.elem.requestFullscreen();
            } else if ((this.elem as any).mozRequestFullScreen) {
                (this.elem as any).mozRequestFullScreen();
            } else if ((this.elem as any).webkitRequestFullscreen) {
                (this.elem as any).webkitRequestFullscreen();
            } else if ((this.elem as any).msRequestFullscreen) {
                (this.elem as any).msRequestFullscreen();
            }
    }

    cancelFullscreen(): void {
        if (this.document.exitFullscreen) {
            this.document.exitFullscreen();
        } else if ((this.document as any).mozCancelFullScreen) {
            (this.document as any).mozCancelFullScreen();
        } else if ((this.document as any).webkitExitFullscreen) {
            (this.document as any).webkitExitFullscreen();
        } else if ((this.document as any).msExitFullscreen) {
            (this.document as any).msExitFullscreen();
        }
    }

}
