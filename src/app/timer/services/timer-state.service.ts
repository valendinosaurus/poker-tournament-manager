import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Tournament } from '../../shared/interfaces/tournament.interface';
import { SeriesMetadata } from '../../shared/interfaces/series.interface';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { Player } from '../../shared/interfaces/player.interface';
import { Entry } from '../../shared/interfaces/entry.interface';
import { Finish } from '../../shared/interfaces/finish.interface';
import { Elimination } from '../../shared/interfaces/elimination.interface';
import { ConductedFinish } from '../../shared/interfaces/util/conducted-finish.interface';
import { ConductedElimination } from '../../shared/interfaces/util/conducted-elimination.interface';
import { ConductedEntry } from '../../shared/interfaces/util/conducted-entry.interface';
import { LocalStorageService } from '../../shared/services/util/local-storage.service';

@Injectable({
    providedIn: 'root'
})
export class TimerStateService {

    private localStorageService: LocalStorageService = inject(LocalStorageService);

    tournament: WritableSignal<Tournament> = signal({} as Tournament);
    metadata: WritableSignal<SeriesMetadata | undefined> = signal(undefined);
    clientId: WritableSignal<number> = signal(-1);

    isProOrAdmin: WritableSignal<boolean> = signal(false);

    autoSlide: WritableSignal<boolean> = signal(this.localStorageService.getLocalSettings().autoSlide ?? true);
    showCondensedBlinds: WritableSignal<boolean> = signal(this.localStorageService.getLocalSettings().showCondensedBlinds ?? true);
    isFullScreen: WritableSignal<boolean> = signal(false);
    isBigCursor: WritableSignal<boolean> = signal(false);

    players: Signal<Player[]> = computed(() => this.tournament().players);
    entries: Signal<Entry[]> = computed(() => this.tournament().entries);
    finishes: Signal<Finish[]> = computed(() => this.tournament().finishes);
    eliminations: Signal<Elimination[]> = computed(() => this.tournament().eliminations);

    allAvailablePlayers: WritableSignal<Player[]> = signal([]);
    playersNotInTournament: Signal<Player[]> = computed(() =>
        this.allAvailablePlayers().filter(
            (player: Player) => !this.players().map(p => p.id).includes(player.id)
        )
    );

    isRunning: WritableSignal<boolean> = signal(false);
    currentLevelIndex: WritableSignal<number> = signal(0);
    isTournamentLocked = computed(() => Boolean(this.tournament().locked));

    // isSimpleTournament: Signal<boolean> = computed(() =>
    //     this.tournament().players.length === 0
    //     && !this.tournament().withRebuy
    //     && !this.tournament().withAddon
    //     && !this.tournament().withReEntry
    // );

    isRebuyPhaseFinished: Signal<boolean> = computed(() =>
        (
            this.currentLevelIndex() > this.tournament().structure.findIndex(b => b.endsRebuy)
            || this.tournament().structure.findIndex(b => b.endsRebuy) === -1
        )
        && this.tournament().players.length > 0
    );

    isTournamentFinished: Signal<boolean> = computed(() =>
        this.tournament().players.length === this.tournament().finishes.length
        && this.tournament().finishes.length > 0
        && this.tournament().players.length > 0
    );

    canStartTournament: Signal<boolean> = computed(() =>
        Array.from(
            new Set(
                this.entries()
                    .filter((entry: Entry) => entry.type === EntryType.ENTRY)
                    .map((entry: Entry) => entry.playerId)
            )
        ).length === this.players().length
    );

    started: WritableSignal<Date | undefined> = signal(undefined);

    elapsed: Signal<number> = computed(() => {
        const started = this.started();
        return started ? new Date().getTime() - started.getTime() : 0;
    });

    totalPricePoolWithoutDeduction = computed(() =>
        this.entries().filter(
            (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
        ).length * +this.tournament().buyInAmount
        + this.entries().filter(e => e.type === EntryType.REBUY).length * +this.tournament().rebuyAmount
        + this.entries().filter(e => e.type === EntryType.ADDON).length * +this.tournament().addonAmount
        + +this.tournament().initialPricePool
    );

    pricePoolDeduction = computed(() => {
        const metadata = this.metadata();

        const reductionFull = this.totalPricePoolWithoutDeduction()
            * (metadata?.percentage ? (metadata?.percentage / 100) : 0);

        return (
            reductionFull > (metadata?.maxAmountPerTournament ?? reductionFull)
                ? metadata?.maxAmountPerTournament
                : reductionFull
        ) ?? 0;
    });

    totalPricePool = computed(() =>
        this.totalPricePoolWithoutDeduction() - this.pricePoolDeduction()
    );

    simplePricePool = computed(() => {
        const buyInsReEntries: number = this.entries().filter(
            (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
        ).length * this.tournament().buyInAmount;

        const rebuys: number = this.entries().filter(e => e.type === EntryType.REBUY).length * this.tournament().rebuyAmount;
        const addons: number = this.entries().filter(e => e.type === EntryType.ADDON).length * this.tournament().addonAmount;

        return buyInsReEntries + rebuys + addons + +this.tournament().initialPricePool;
    });

    withRebuy: Signal<boolean> = computed(() => this.tournament().withRebuy);
    withAddon: Signal<boolean> = computed(() => this.tournament().withAddon);
    withReEntry: Signal<boolean> = computed(() => this.tournament().withReEntry);
    withBounty: Signal<boolean>;

    eligibleForEntry: Signal<Player[]> = computed(() =>
        this.players().filter((player: Player) =>
            !this.finishes().map(f => f.playerId).includes(player.id)
        ).filter((player: Player) =>
            !this.entries().filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.ENTRY
            ).map(e => e.playerId).includes(player.id)
        )
    );

    eligibleForReEntry: Signal<Player[]> = computed(() =>
        this.players().filter((player: Player) => this.finishes().map(f => f.playerId).includes(player.id)
        ).filter((player: Player) => {
            const allowed = this.tournament().noOfReEntries;
            const rebuysOfPlayer = this.entries().filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.RE_ENTRY
            ).length;

            return rebuysOfPlayer < allowed;
        })
    );

    conductedEntries: Signal<ConductedEntry[]> = computed(() =>
        this.entries().filter(
            (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
        ).map((entry: Entry) => this.mapToConductedEntry(entry))
            .sort((a, b) => b.time - a.time)
    );

    eligibleForSeatOpen: Signal<Player[]> = computed(() =>
        this.players().filter((player: Player) =>
            !this.finishes()
                .map(f => f.playerId)
                .includes(player.id)
        ).filter((player: Player) =>
            this.entries()
                .filter(e => e.type === EntryType.ENTRY)
                .map(f => f.playerId)
                .includes(player.id)
        )
    );

    playersToEliminate = computed(() => this.eligibleForSeatOpen().map(
        player => ({
            label: player.name,
            value: player.id
        })
    ));

    conductedFinishes: Signal<ConductedFinish[]> = computed(() =>
        this.finishes().map((finish: Finish) => ({
                tId: this.tournament().id,
                playerId: finish.playerId,
                image: this.players().filter(p => p.id === finish.playerId)[0].image,
                name: this.players().filter(p => p.id === finish.playerId)[0].name,
                time: finish.timestamp,
                rank: +finish.rank
            })
        ).sort(
            (a, b) => a.rank - b.rank
        )
    );

    eligibleForRebuy: Signal<Player[]> = computed(() =>
        this.players().filter(
            (player: Player) => !this.finishes().map(f => f.playerId).includes(player.id)
        ).filter(
            (player: Player) => this.entries().filter(e => e.type === EntryType.ENTRY).map(f => f.playerId).includes(player.id)
        ).filter(
            (player: Player) => this.entries().filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.REBUY
            ).length < this.tournament().noOfRebuys
        )
    );

    playersToRebuy = computed(() => this.eligibleForRebuy().map(
        player => ({
            label: player.name,
            value: player.id
        })
    ));

    conductedRebuys: Signal<ConductedEntry[]> = computed(() =>
        this.entries().filter(
            (entry: Entry) => entry.type === EntryType.REBUY
            // TODO extract duplicate
        )
            .map((entry: Entry) => this.mapToConductedEntry(entry))
            .sort((a, b) => b.time - a.time)
    );

    eligibleForAddon: Signal<Player[]> = computed(() =>
        this.players().filter(
            (player: Player) => !this.finishes().map(f => f.playerId).includes(player.id)
        ).filter(
            (player: Player) => this.entries().filter(e => e.type === EntryType.ENTRY).map(f => f.playerId).includes(player.id)
        ).filter((player: Player) => {
            const allowed = 1;
            const addonsOfPlayer = this.entries().filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.ADDON
            ).length;

            return addonsOfPlayer < allowed;
        })
    );

    playersToAddOn = computed(() => this.eligibleForAddon().map(player => ({
            label: player.name,
            value: player.id
        })
    ));

    conductedAddons: Signal<ConductedEntry[]> = computed(() =>
        this.entries().filter(
            (entry: Entry) => entry.type === EntryType.ADDON
            // TODO extract duplicate
        )
            .map((entry: Entry) => this.mapToConductedEntry(entry))
            .sort((a, b) => b.time - a.time)
    );

    conductedEliminations: Signal<ConductedElimination[]> = computed(() =>
        this.eliminations().filter((elimination: Elimination) => elimination.eliminator !== -1)
            .map(
                (elimination: Elimination) => ({
                    tId: this.tournament().id,
                    eliminatorId: elimination.eliminator,
                    eliminatorImage: this.players().filter(p => p.id === elimination.eliminator)[0].image,
                    eliminatorName: this.players().filter(p => p.id === elimination.eliminator)[0].name,
                    eliminatedId: elimination.eliminated,
                    eliminatedImage: this.players().filter(p => p.id === elimination.eliminated)[0].image,
                    eliminatedName: this.players().filter(p => p.id === elimination.eliminated)[0].name,
                    time: elimination.timestamp,
                    eId: elimination.eId
                })
            )
            .sort((a, b) => b.time - a.time)
    );

    startTimer(): void {
        if (!this.isRunning() && this.canStartTournament() && !this.isTournamentFinished()) {
            this.isRunning.set(true);

            if (!this.localStorageService.getTournamentStarted(this.tournament().id)) {
                this.started.set(new Date());
                this.localStorageService.storeTournamentStarted(this.tournament().id, new Date());
            }
        }
    }

    pauseTimer(): void {
        if (this.isRunning()) {
            this.isRunning.set(false);
        }
    }

    private mapToConductedEntry(entry: Entry): ConductedEntry {
        return {
            entryId: entry.id ?? -1,
            time: entry.timestamp,
            playerId: (this.players().filter(p => p.id === entry.playerId)[0].id) ?? -1,
            name: (this.players().filter(p => p.id === entry.playerId)[0].name) ?? '',
            image: (this.players().filter(p => p.id === entry.playerId)[0].image) ?? '',
            isFinished: this.finishes().map(f => f.playerId).includes(entry.playerId),
            type: entry.type,
            isBlocked: this.entries().filter(e => e.type === EntryType.ADDON
                || e.type === EntryType.REBUY).map(e => e.playerId).includes(entry.playerId)

        };
    }

}
