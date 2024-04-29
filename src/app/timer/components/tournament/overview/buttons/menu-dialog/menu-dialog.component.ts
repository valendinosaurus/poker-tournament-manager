import { Component, DestroyRef, EventEmitter, HostListener, inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../../../shared/models/tournament.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddEntryComponent } from '../../../../../../dialogs/add-entry/add-entry.component';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { TournamentSettings } from '../../../../../../shared/models/tournament-settings.interface';
import { Observable, ReplaySubject } from 'rxjs';
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
import { AsyncPipe, DOCUMENT, NgIf } from '@angular/common';
import { ActionEventApiService } from '../../../../../../core/services/api/action-event-api.service';
import { LocalStorageService } from '../../../../../../core/services/util/local-storage.service';
import { TableDrawDialogComponent } from '../../../../../../dialogs/table-draw/table-draw-dialog.component';
import { DEFAULT_DIALOG_POSITION, TIMER_DIALOG_PANEL_CLASS } from '../../../../../../core/const/app.const';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SeriesMetadata } from '../../../../../../shared/models/series.interface';
import { CreatePlayerComponent } from '../../../../../../dialogs/create-player/create-player.component';
import { AuthUtilService } from '../../../../../../core/services/auth-util.service';

@Component({
    selector: 'app-menu-dialog',
    templateUrl: './menu-dialog.component.html',
    styleUrls: ['./menu-dialog.component.scss'],
    standalone: true,
    imports: [NgIf, MatButtonModule, RouterLink, FormsModule, ReactiveFormsModule, FormlyModule, AsyncPipe]
})
export class MenuDialogComponent implements OnInit {

    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();
    @Output() toggleAutoSlide = new EventEmitter<boolean>();
    @Output() toggleShowCondensedBlinds = new EventEmitter<boolean>();
    @Output() localRefresh = new EventEmitter<void>();

    private dialogRef: MatDialogRef<MenuDialogComponent> = inject(MatDialogRef<MenuDialogComponent>);

    autoSlide = true;
    isFullscreen = false;
    isBigCursor = false;
    elem: HTMLElement;

    data: {
        isSimpleTournament: boolean,
        isRebuyPhaseFinished$: ReplaySubject<boolean>,
        isAddPlayerBlocked: boolean,
        tournament: Tournament,
        seriesMetadata: SeriesMetadata,
        clientId: number,
        running: boolean,
    } = inject(MAT_DIALOG_DATA);

    payoutCache: number;

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: TournamentSettings;

    fields: FormlyFieldConfig[];

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private rankingService: RankingService = inject(RankingService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private fetchService: FetchService = inject(FetchService);
    private document: Document = inject(DOCUMENT);
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    isAuthenticated$: Observable<boolean> = this.authUtilService.getIsAuthenticated$();

    showCondensedBlinds = this.localStorageService.getLocalSettings().showCondensedBlinds;

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
            payout: this.data.tournament.payout,
            name: this.data.tournament.name
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
            ),
            this.formlyFieldService.getDefaultTextField('name', 'Name', false)
        ];
    }

    // TODO include
    createPlayer(): void {
        this.dialog.open(CreatePlayerComponent);
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                tournamentId: this.data.tournament.id,
                tournamentName: this.data.tournament.name,
                clientId: this.data.clientId
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                tournamentId: this.data.tournament.id,
                tournamentName: this.data.tournament.name,
                clientId: this.data.clientId
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
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

    addPlayer(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                tournament: this.data.tournament,
                clientId: this.data.clientId,
                multi: false
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    addEntry(isReEntry: boolean): void {
        const dialogRef = this.dialog.open(AddEntryComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                tournamentId: this.data.tournament.id,
                tournamentName: this.data.tournament.name,
                isReentry: isReEntry,
                clientId: this.data.clientId,
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    makeDeal(): void {
        const dialogRef = this.dialog.open(MakeDealComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
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

    drawTables(): void {
        const dialogRef = this.dialog.open(TableDrawDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                tournament: this.data.tournament,
            },
            id: 'draw'
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    chkScreenMode() {
        this.isFullscreen = !!this.document.fullscreenElement;
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

    onToggleShowCondensedBlinds(): void {
        this.showCondensedBlinds = !this.showCondensedBlinds;
        this.toggleShowCondensedBlinds.emit(this.showCondensedBlinds);
        this.localStorageService.saveShowCondensedBlinds(this.showCondensedBlinds);
    }

    onToggleIsBigCursor(): void {
        this.isBigCursor = !this.isBigCursor;

        if (this.isBigCursor) {
            document.querySelector('body')?.classList.add('big-cursor');
        } else {
            document.querySelector('body')?.classList.remove('big-cursor');
        }
    }

    applySettings(model: TournamentSettings): void {
        this.tournamentApiService.putSettings$(model).pipe(
            take(1),
            tap(() => {
                if (model.payout !== this.payoutCache) {
                    this.localStorageService.deleteAdaptedPayout(this.data.tournament.id);
                }

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

    closeMenu(): void {
        this.dialogRef.close();
    }
}
