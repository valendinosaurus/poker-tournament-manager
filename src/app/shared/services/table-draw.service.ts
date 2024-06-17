import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { LocalStorageService } from './util/local-storage.service';
import { TableDrawSeat } from '../interfaces/table-draw-seat.interface';
import { Player } from '../interfaces/player.interface';
import { TableDraw } from '../interfaces/table-draw.interface';
import { Tournament } from '../interfaces/tournament.interface';
import { TableDrawState } from '../enums/table-draw-state.enum';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from './api/tournament-api.service';

@Injectable({
    providedIn: 'root'
})
export class TableDrawService {

    tournament: WritableSignal<Tournament>;
    tableDraw: WritableSignal<TableDraw> = signal({} as TableDraw);
    maxPlayersPerTable = signal(9);

    playerHasToBeMoved = computed(() =>
        this.tableDraw().playerHasToBeMoved
    );

    tableHasToBeEliminated = computed(() =>
        this.tableDraw().tableHasToBeEliminated
    );

    randomPlayers: Player[];

    emptySeatPlayer: Player = {
        name: '----',
        image: '',
        id: -1,
        locked: false
    };

    private state: TimerStateService = inject(TimerStateService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

    update(): void {
        this.tournament = this.state.tournament;

        //  const draw: TableDraw | undefined = this.localStorageService.getTableDraw(this.tournament().id);

        this.tournamentApiService.getTableDraw$(this.tournament().id).pipe(
            take(1),
            tap((draw: TableDraw | undefined | null) => {
                    if (draw) {
                        this.tableDraw.set(draw);
                        draw.tournament.finishes = [...this.tournament().finishes];
                        this.loadExistingDrawAndCheck(draw);
                    } else {
                        this.setupEmptyTables();
                    }
                }
            )
        ).subscribe();
    }

    setupEmptyTables(): void {
        const tableDraw: TableDraw = {
            tournament: this.tournament(),
            state: TableDrawState.BLANK,
            tables: [],
            maxPlayersPerTable: this.maxPlayersPerTable(),
            availablePlayers: [...this.tournament().players],
            noOfTables: -1,
            tableIndexToAdd: -1,
            tableIndexToTake: -1,
            noOfPlayersToMove: -1,
            playersToMove: undefined,
            tableHasToBeEliminated: false,
            playerHasToBeMoved: false
        };

        const totalNumberOfPlayers = tableDraw.tournament.players.length;
        tableDraw.noOfTables = Math.ceil(totalNumberOfPlayers / tableDraw.maxPlayersPerTable);
        tableDraw.availablePlayers = [...tableDraw.tournament.players];
        tableDraw.tables = [];

        const minPlayersPerTable = Math.floor(totalNumberOfPlayers / tableDraw.noOfTables);
        let additionalPlayers = totalNumberOfPlayers % tableDraw.noOfTables;

        for (let i = 0; i < tableDraw.noOfTables; i++) {
            const table: TableDrawSeat[] = [];

            // TODO add also empty seats filling max players per table

            let seats = Array(tableDraw.maxPlayersPerTable).fill('').map((v, i) => i);

            for (let j = 0; j < minPlayersPerTable; j++) {
                const seat = seats.sort(() => {
                    return 0.5 - Math.random();
                })[0];

                table.push({
                    player: {
                        name: 'tbd',
                        image: '',
                        id: -1,
                        locked: false
                    },
                    isButton: j === 0,
                    table: i,
                    seatNo: seat,
                    fixSeat: false,
                    selectVisible: false,
                    eliminated: false,
                    placeholder: false
                });

                seats = seats.filter(e => e !== seat);
            }

            if (additionalPlayers > 0) {
                const seat = seats.sort(() => {
                    return 0.5 - Math.random();
                })[0];
                table.push({
                    player: {
                        name: 'tbd',
                        image: '',
                        id: -1,
                        locked: false
                    },
                    isButton: false,
                    table: i,
                    seatNo: seat,
                    fixSeat: false,
                    selectVisible: false,
                    eliminated: false,
                    placeholder: false
                });
                seats = seats.filter(e => e !== seat);

                additionalPlayers--;
            }

            if (seats.length > 0) {
                seats.forEach(e => table.push({
                    table: i,
                    seatNo: e,
                    player: {...this.emptySeatPlayer},
                    eliminated: false,
                    fixSeat: false,
                    isButton: false,
                    selectVisible: false,
                    placeholder: true
                }));
            }

            tableDraw.tables.push(table);
        }

        tableDraw.tables = tableDraw.tables.map(
            t => [
                ...t.sort((a, b) => a.seatNo - b.seatNo)
            ]
        );

        this.tableDraw.set(tableDraw);

        this.tournamentApiService.deleteTableDraw$(tableDraw.tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(tableDraw))
        ).subscribe();
    }

    confirmSetup(): void {
        this.tableDraw.update(
            (tableDraw: TableDraw) => ({
                ...tableDraw,
                state: TableDrawState.SET_UP
            })
        );

        this.tournamentApiService.deleteTableDraw$(this.tableDraw().tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(this.tableDraw()))
        ).subscribe();
    }

    loadExistingDrawAndCheck(tableDraw: TableDraw): void {
        const fixedSeats: number[] = [];

        tableDraw.tables.forEach(t => {
            t.forEach(
                p => {
                    if (p.fixSeat) {
                        fixedSeats.push(p.player.id);
                    }
                }
            );
        });

        this.randomPlayers = this.shuffle(tableDraw.tournament.players);

        tableDraw.availablePlayers = [
            ...this.randomPlayers.filter(p => !fixedSeats.includes(p.id) && !tableDraw.tournament.finishes.map(e => e.playerId).includes(p.id))
        ];

        const eliminatedPlayers = tableDraw.tournament.players.filter(
            p => tableDraw.tournament.finishes.map(e => e.playerId).includes(p.id)
        );

        tableDraw.tables.forEach(
            t => t.forEach(
                p =>
                    p.eliminated = eliminatedPlayers.map(a => a.id).includes(p.player.id)
            )
        );

        const numberOfRemainingPlayersPerTable: number[] = [];

        tableDraw.tables.forEach(
            t => {
                numberOfRemainingPlayersPerTable.push(t.filter(e => !e.eliminated && !e.placeholder).length
                );
            });

        const min = Math.min(...numberOfRemainingPlayersPerTable);
        const max = Math.max(...numberOfRemainingPlayersPerTable);

        tableDraw.playerHasToBeMoved = max - min > 1;

        if (tableDraw.playerHasToBeMoved) {
            tableDraw.noOfPlayersToMove = Math.floor((max - min) / 2);
            tableDraw.tableIndexToTake = tableDraw.tables.indexOf(tableDraw.tables.filter(t => t.filter(e => !e.eliminated && !e.placeholder).length === max)[0]);
            tableDraw.tableIndexToAdd = tableDraw.tables.indexOf(tableDraw.tables.filter(t => t.filter(e => !e.eliminated && !e.placeholder).length === min)[0]);
        }

        const availableSeats = tableDraw.tables.length * tableDraw.maxPlayersPerTable;
        const remainingPlayers = this.flatten(tableDraw.tables).filter(e => !e.eliminated && !e.placeholder).length;

        tableDraw.tableHasToBeEliminated = (availableSeats - remainingPlayers) >= tableDraw.maxPlayersPerTable;

        if (tableDraw.tableHasToBeEliminated) {
            tableDraw.playerHasToBeMoved = false;
        }

        this.tournamentApiService.deleteTableDraw$(tableDraw.tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(tableDraw))
        ).subscribe();
    }

    addFixedSeat(table: number, seat: number, player: Player): void {
        this.tableDraw.update((tableDraw: TableDraw) => {
            tableDraw.tables[table][seat].fixSeat = true;
            tableDraw.tables[table][seat].player = player;
            tableDraw.tables[table][seat].selectVisible = false;
            tableDraw.availablePlayers = tableDraw.availablePlayers.filter(p => p.id !== player.id);

            return tableDraw;
        });

        this.tournamentApiService.deleteTableDraw$(this.tableDraw().tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(this.tableDraw()))
        ).subscribe();
    }

    drawPlayers(): void {
        let index = 0;

        this.tableDraw.update((tableDraw: TableDraw) => {
            tableDraw.availablePlayers = this.shuffle(tableDraw.availablePlayers);
            tableDraw.state = TableDrawState.DRAWN;

            for (let i = 0; i < tableDraw.tables.length; i++) {
                for (let j = 0; j < tableDraw.tables[i].length; j++) {
                    if (!tableDraw.tables[i][j].fixSeat && !tableDraw.tables[i][j].player.name.includes('----')) {
                        tableDraw.tables[i][j].player = tableDraw.availablePlayers[index];
                        index++;
                    }
                }
            }

            return tableDraw;
        });

        this.tournamentApiService.deleteTableDraw$(this.tableDraw().tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(this.tableDraw()))
        ).subscribe();
    }

    movePlayer(): void {
        this.tableDraw.update((tableDraw: TableDraw) => {

            tableDraw.playersToMove = this.shuffle([...tableDraw.tables[tableDraw.tableIndexToTake].filter(e => !e.placeholder && !e.fixSeat)]).slice(0, tableDraw.noOfPlayersToMove);

            const indexes: number[] = [];

            for (let i = 0; i < tableDraw.tables[tableDraw.tableIndexToTake].length; i++) {
                if (tableDraw.playersToMove.map(p => p.player.id).includes(tableDraw.tables[tableDraw.tableIndexToTake][i].player.id)) {
                    indexes.push(i);
                }
            }

            indexes.forEach((index: number) => {
                tableDraw.tables[tableDraw.tableIndexToTake][index] = {
                    ...tableDraw.tables[tableDraw.tableIndexToTake][index],
                    placeholder: true,
                    eliminated: false,
                    player: this.emptySeatPlayer,
                };
            });

            const newSeats = this.getRandomFreeSeatIndexes(tableDraw, indexes.length);

            const indexesOfNewSeats: number[] = [];

            for (let i = 0; i < tableDraw.tables[tableDraw.tableIndexToAdd].length; i++) {
                if (newSeats.includes(tableDraw.tables[tableDraw.tableIndexToAdd][i].seatNo)) {
                    indexesOfNewSeats.push(i);
                }
            }

            for (let i = 0; i < indexes.length; i++) {
                tableDraw.tables[tableDraw.tableIndexToAdd][indexesOfNewSeats[i]] = {
                    ...tableDraw.playersToMove[i],
                    seatNo: newSeats[i],
                    placeholder: false,
                    eliminated: false
                };
            }

            tableDraw.tables = tableDraw.tables.map(
                t => t.sort((a, b) => a.seatNo - b.seatNo)
            );

            for (let i = 0; i < tableDraw.tables.length; i++) {
                for (let j = 0; j < tableDraw.tables[i].length; j++) {
                    if (tableDraw.tables[i][j].eliminated) {
                        tableDraw.tables[i][j] = {
                            ...tableDraw.tables[i][j],
                            player: this.emptySeatPlayer,
                            eliminated: false,
                            placeholder: true
                        };
                    }
                }
            }

            tableDraw.playerHasToBeMoved = false;

            return tableDraw;
        });

        this.tournamentApiService.deleteTableDraw$(this.tableDraw().tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(this.tableDraw()))
        ).subscribe();
    }

    getRandomFreeSeatIndexes(tableDraw: TableDraw, noOfSeats: number): number[] {
        if (noOfSeats > tableDraw.tables[tableDraw.tableIndexToAdd].map(e => e.placeholder || e.eliminated).length) {
            throw new Error('index out of bounds bro');
        }

        const table = tableDraw.tables[tableDraw.tableIndexToAdd];
        const emptySeats = this.shuffle(
            table.filter(e => e.placeholder || e.eliminated).map(e => e.seatNo)
        ).slice(0, noOfSeats);

        return emptySeats;
    }

    eliminateTable(): void {
        this.tableDraw.update((tableDraw: TableDraw) => {
            const tableToEliminateIndex = tableDraw.tables.length - 1; // TODO random

            const playersToDistribute = this.shuffle([...tableDraw.tables[tableToEliminateIndex]].filter(e => !e.eliminated && !e.placeholder));

            let distributionIndex = 0;

            for (let i = 0; i < tableToEliminateIndex; i++) {
                for (let j = 0; j < tableDraw.tables[i].length; j++) {
                    if (tableDraw.tables[i][j].placeholder || tableDraw.tables[i][j].eliminated) {

                        tableDraw.tables[i][j] = {
                            ...tableDraw.tables[i][j],
                            placeholder: false,
                            eliminated: false,
                            isButton: false,
                            player: playersToDistribute[distributionIndex++].player
                        };
                    }
                }
            }

            tableDraw.tables.pop();
            tableDraw.tableHasToBeEliminated = false;

            return tableDraw;
        });

        this.tournamentApiService.deleteTableDraw$(this.tableDraw().tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(this.tableDraw()))
        ).subscribe();
    }

    shuffle<T>(array: T[]): T[] {
        const result = [], itemsLeft = array.concat([]);

        while (itemsLeft.length) {
            const randomIndex = Math.floor(Math.random() * itemsLeft.length);
            const [randomItem] = itemsLeft.splice(randomIndex, 1); // take out a random item from itemsLeft
            result.push(randomItem); // ...and add it to the result
        }

        return result;
    }

    flatten<T>(arr: T[][]): T[] {
        return ([] as T[]).concat(...arr);
    }

    resetTableDraw(): void {
        this.tournamentApiService.deleteTableDraw$(this.tournament().id).pipe(
            take(1),
            tap(() => this.tableDraw.update((tableDraw: TableDraw) => {
                tableDraw.tables = [];
                tableDraw.state = TableDrawState.BLANK;
                tableDraw.tableHasToBeEliminated = false;
                tableDraw.playerHasToBeMoved = false;
                tableDraw.playersToMove = undefined;

                return tableDraw;
            }))
        ).subscribe();
    }

    playerMoved(): void {
        this.tableDraw.update((tableDraw: TableDraw) => ({
            ...tableDraw,
            playersToMove: undefined
        }));

        this.tournamentApiService.deleteTableDraw$(this.tableDraw().tournament.id).pipe(
            take(1),
            switchMap(() => this.tournamentApiService.postTableDraw$(this.tableDraw()))
        ).subscribe();
    }
}
