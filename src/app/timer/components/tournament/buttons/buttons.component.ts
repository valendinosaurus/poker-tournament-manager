import { Component, DestroyRef, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { EventApiService } from '../../../../core/services/api/event-api.service';
import { ServerResponse } from '../../../../shared/models/server-response';
import { take } from 'rxjs/operators';
import { CreatePlayerComponent } from '../../../../admin/components/player/create-player/create-player.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddPlayerComponent } from '../../../../admin/components/dialogs/add-player/add-player.component';
import { AddEntryComponent } from '../../../../admin/components/dialogs/add-entry/add-entry.component';
import { AddRebuyComponent } from '../../../../admin/components/dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from '../../../../admin/components/dialogs/add-addon/add-addon.component';
import { MakeDealComponent } from '../../../../admin/components/dialogs/make-deal/make-deal.component';
import { AddFinishComponent } from '../../../../admin/components/dialogs/add-finish/add-finish.component';
import { MatDialog } from '@angular/material/dialog';
import { TournamentService } from '../../../../core/services/util/tournament.service';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent implements OnInit {

    @Input() randomId: number;
    @Input() running: boolean;
    @Input() tournament: Tournament;
    @Input() seriesMetadata: SeriesMetadata | null;
    @Input() isSimpleTournament: boolean;
    @Input() isRebuyPhaseFinished: boolean;

    isOverlayOpen = false;
    isFullscreen = false;
    elem: HTMLElement;

    dialogPosition = {
        position: {
            top: '40px'
        }
    };

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private authService: AuthService = inject(AuthService);
    private document: Document = inject(DOCUMENT);
    private eventApiService: EventApiService = inject(EventApiService);
    private tournamentService: TournamentService = inject(TournamentService);

    isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;

    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();
    @Output() toggleAutoSlide = new EventEmitter<boolean>();

    autoSlide = true;

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullScreenModes(_event: Event) {
        this.chkScreenMode();
    }

    ngOnInit(): void {
        this.elem = this.document.documentElement;
    }

    // TODO include
    createPlayer(): void {
        this.dialog.open(CreatePlayerComponent);
    }

    addPlayer(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.tournament,
                randomId: this.randomId
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    addEntry(isReEntry: boolean): void {
        const dialogRef = this.dialog.open(AddEntryComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.tournament.id,
                isReentry: isReEntry,
                randomId: this.randomId,
                eligibleForEntryOrReEntry: this.tournamentService.getPlayersEligibleForEntryOrReEntry(this.tournament, isReEntry)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.tournament.id,
                randomId: this.randomId,
                eligibleForRebuy: this.tournamentService.getPlayersEligibleForRebuy(this.tournament),
                conductedRebuys: this.tournamentService.getConductedRebuys(this.tournament)
            }
        });

        console.log(this.tournament);

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.tournament.id,
                randomId: this.randomId,
                eligibleForAddon: this.tournamentService.getPlayersEligibleForAddon(this.tournament),
                conductedAddons: this.tournamentService.getConductedAddons(this.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    makeDeal(): void {
        const dialogRef = this.dialog.open(MakeDealComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.tournament,
                metadata: this.seriesMetadata,
                randomId: this.randomId
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.tournament,
                metadata: this.seriesMetadata,
                randomId: this.randomId,
                eligibleForSeatOpen: this.tournamentService.getPlayersEligibleForSeatOpen(this.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    chkScreenMode() {
        if (this.document.fullscreenElement) {
            this.isFullscreen = true;
        } else {
            this.isFullscreen = false;
        }
    }

    fullScreen(): void {
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

    onToggleAutoSlide(): void {
        this.autoSlide = !this.autoSlide;
        this.toggleAutoSlide.emit(this.autoSlide);
    }

    notify(): void {
        this.getReFetchEvent$().pipe(
            take(1)
        ).subscribe();
    }

    getReFetchEvent$(): Observable<ServerResponse> {
        return this.eventApiService.post$({
            id: null,
            tId: this.tournament.id,
            clientId: this.randomId
        });
    }
}
