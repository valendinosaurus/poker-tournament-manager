import { Component, DestroyRef, EventEmitter, HostListener, inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../../../../../shared/models/series-metadata.interface';
import { CreatePlayerComponent } from '../../../../../../admin/components/player/create-player/create-player.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddEntryComponent } from '../../../../../../dialogs/add-entry/add-entry.component';
import { TournamentService } from '../../../../../../core/services/util/tournament.service';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { TournamentSettings } from '../../../../../../shared/models/tournament-settings.interface';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { MakeDealComponent } from '../../../../../../dialogs/make-deal/make-deal.component';
import { AddRebuyComponent } from '../../../../../../dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from '../../../../../../dialogs/add-addon/add-addon.component';
import { AddFinishComponent } from '../../../../../../dialogs/add-finish/add-finish.component';
import { FormlyFieldService } from '../../../../../../core/services/util/formly-field.service';
import { RankingService } from '../../../../../../core/services/util/ranking.service';
import { AddPlayerComponent } from '../../../../../../dialogs/add-player/add-player.component';
import { switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../../../core/services/api/tournament-api.service';
import { FetchService } from '../../../../../../core/services/fetch.service';
import { DOCUMENT } from '@angular/common';
import { EventApiService } from '../../../../../../core/services/api/event-api.service';
import { LocalStorageService } from '../../../../../../core/services/util/local-storage.service';

@Component({
    selector: 'app-menu-dialog',
    templateUrl: './menu-dialog.component.html',
    styleUrls: ['./menu-dialog.component.scss']
})
export class MenuDialogComponent implements OnInit {

    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();
    @Output() toggleAutoSlide = new EventEmitter<boolean>();
    @Output() localRefresh = new EventEmitter<void>();

    private dialogRef: MatDialogRef<MenuDialogComponent> = inject(MatDialogRef<MenuDialogComponent>);

    autoSlide = true;
    isFullscreen = false;
    elem: HTMLElement;

    data: {
        isSimpleTournament: boolean,
        isRebuyPhaseFinished: boolean,
        tournament: Tournament,
        seriesMetadata: SeriesMetadata,
        clientId: number,
        sub: string,
        running: boolean,
    } = inject(MAT_DIALOG_DATA);

    dialogPosition = {
        position: {
            top: '40px'
        }
    };
    payoutCache: number;

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: TournamentSettings;

    fields: FormlyFieldConfig[];

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private tournamentService: TournamentService = inject(TournamentService);
    private authService: AuthService = inject(AuthService);
    private rankingService: RankingService = inject(RankingService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private fetchService: FetchService = inject(FetchService);
    private document: Document = inject(DOCUMENT);
    private eventApiService: EventApiService = inject(EventApiService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullScreenModes(_event: Event) {
        this.chkScreenMode();
    }

    ngOnInit(): void {

        this.elem = this.document.documentElement;
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: this.data.tournament.id,
            payout: this.data.tournament.payout
        };

        this.payoutCache = this.data.tournament.payout;
    }

    private initFields(): void {
        const payouts = this.rankingService.payouts.sort(
            (a, b) => a.prices.length - b.prices.length
        );

        const placesLeft = this.data.tournament.players.length - this.data.tournament.finishes.length;
        const payoutDone = this.data.tournament.finishes.filter(f => +f.price > 0).length > 0;

        const payoutsForSelect = payouts.map(p => ({
            label: p.prices.reduce((acc, curr) => `${acc} | ${curr}%`, ''),
            value: p.id,
            length: p.prices.length
        })).filter(
            e => e.length <= placesLeft
        ).map(e => ({
            value: e.value,
            label: `${e.length} places paid - ${e.label.slice(3)}`
        }));

        this.fields = [
            this.formlyFieldService.getDefaultSelectField(
                'payout',
                'Payout structure',
                true,
                payoutsForSelect,
                payoutDone
            )
        ];
    }

    // TODO include
    createPlayer(): void {
        this.dialog.open(CreatePlayerComponent);
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.data.tournament.id,
                tournamentName: this.data.tournament.name,
                clientId: this.data.clientId,
                eligibleForRebuy: this.tournamentService.getPlayersEligibleForRebuy(this.data.tournament),
                conductedRebuys: this.tournamentService.getConductedRebuys(this.data.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.data.tournament.id,
                tournamentName: this.data.tournament.name,
                clientId: this.data.clientId,
                eligibleForAddon: this.tournamentService.getPlayersEligibleForAddon(this.data.tournament),
                conductedAddons: this.tournamentService.getConductedAddons(this.data.tournament)
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
                tournament: this.data.tournament,
                metadata: this.data.seriesMetadata,
                clientId: this.data.clientId,
                eligibleForSeatOpen: this.tournamentService.getPlayersEligibleForSeatOpen(this.data.tournament),
                conductedSeatOpens: this.tournamentService.getConductedSeatOpens(this.data.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    addPlayer(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.data.tournament,
                clientId: this.data.clientId,
                multi: false,
                sub: this.data.sub
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
                tournamentId: this.data.tournament.id,
                tournamentName: this.data.tournament.name,
                isReentry: isReEntry,
                clientId: this.data.clientId,
                eligibleForEntryOrReEntry: this.tournamentService.getPlayersEligibleForEntryOrReEntry(this.data.tournament, isReEntry),
                conductedEntries: this.tournamentService.getConductedEntries(this.data.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    makeDeal(): void {
        const dialogRef = this.dialog.open(MakeDealComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.data.tournament,
                metadata: this.data.seriesMetadata,
                clientId: this.data.clientId
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

    applySettings(model: TournamentSettings): void {
        this.tournamentApiService.putSettings$(model).pipe(
            take(1),
            tap(() => {
                if (model.payout !== this.payoutCache) {
                    this.localStorageService.deleteAdaptedPayout(this.data.tournament.id);
                }

                // this.isOverlayOpen = false;
                this.localRefresh.emit();
            }),
            tap(() => {
                this.fetchService.trigger();
            }),
            switchMap(() => this.eventApiService.post$({
                id: null,
                tId: this.data.tournament.id,
                clientId: this.data.clientId
            })),
        ).subscribe();
    }
}
