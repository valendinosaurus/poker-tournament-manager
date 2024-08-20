import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { TableDraw, TableDrawEventType } from '../interfaces/table-draw.interface';
import { TableDrawStep } from '../enums/table-draw-step.enum';
import { take } from 'rxjs/operators';
//import { Finish } from '../../shared/interfaces/finish.interface';
import { TableDrawTable } from '../interfaces/table-draw-table.interface';
import { TableDrawSeat } from '../interfaces/table-draw-seat.interface';
import { TableDrawAction } from '../enums/table-draw-action.enum';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { Player } from '../../shared/interfaces/player.interface';

@Injectable({
    providedIn: 'root'
})
export class TableDrawService {

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

    tableDraw: WritableSignal<TableDraw | undefined> = signal(undefined); // = signal({} as TableDraw);
    maxPlayersPerTable = signal(9);
    minTables = signal(1);
    maxTables = signal(9);

    id: WritableSignal<number> = signal(-1);
    players: Signal<Player[]> = computed(() => this.tableDraw()?.players ?? []);
    finishedPlayerIds: Signal<number[]> = computed(() => this.tableDraw()?.finishedPlayerIds ?? []);

    currentStep = computed(() => this.tableDraw()?.step ?? TableDrawStep.BLANK);
    currentAction = computed(() => this.tableDraw()?.action ?? TableDrawAction.NONE);

    newPlayers = computed(() => this.tableDraw()?.newPlayers ?? []);

    persistDrawToDb = signal(true);
    autoDraw = signal(false);
    autoEliminate = signal(false);

    readonly EMPTY_SEAT: Player = {
        name: '----',
        image: '',
        id: -1,
        locked: false
    };

    update(id?: number): void {
        if (id !== undefined) {
            this.id.set(id);
        }

        const draw = this.tableDraw();

        if (draw) {
            this.loadExistingDrawAndCheck(draw);
        } else {
            this.setupEmptyTables(id);
        }
    }

    setupEmptyTables(id?: number): void {
        if (id !== undefined) {
            this.id.set(id);
        }

        const tableDraw: TableDraw = {
            id: id ?? this.id(),
            players: [...this.players()],
            finishedPlayerIds: [...this.finishedPlayerIds()],
            step: TableDrawStep.BLANK,
            tables: [],
            maxPlayersPerTable: this.maxPlayersPerTable() ?? 9,
            availablePlayers: [...this.players()],
            noOfTables: 1,
            tableIndexToAdd: -1,
            tableIndexToTake: -1,
            noOfPlayersToMove: -1,
            action: TableDrawAction.NONE,
            playersToMove: undefined,
            newPlayers: [],
            minTables: this.minTables(),
            maxTables: this.maxTables(),
            events: [],
            waitingList: []
        };

        const totalNumberOfPlayers = tableDraw.players.length;
        const numberOfNeededTables = Math.ceil(totalNumberOfPlayers / this.maxPlayersPerTable()/*tableDraw.maxPlayersPerTable*/);

        if (numberOfNeededTables < this.minTables()) {
            tableDraw.noOfTables = this.minTables();
            tableDraw.action = TableDrawAction.NONE;

        } else if (numberOfNeededTables > this.maxTables()) {
            tableDraw.noOfTables = this.maxTables();
            tableDraw.action = TableDrawAction.TOO_MANY_PLAYERS_FOR_AVAILABLE_SEATS;

        } else {
            tableDraw.noOfTables = numberOfNeededTables;
            tableDraw.action = TableDrawAction.NONE;
        }

        tableDraw.availablePlayers = [...tableDraw.players];
        tableDraw.tables = [];

        const minPlayersPerTable = Math.floor(totalNumberOfPlayers / tableDraw.noOfTables);
        let additionalPlayers = totalNumberOfPlayers % tableDraw.noOfTables;

        for (let i = 0; i < tableDraw.noOfTables; i++) {
            const table: TableDrawTable = {
                tableName: 'Table ' + (i + 1),
                seats: []
            };

            // TODO add also empty seats filling max players per table

            let seats = Array(this.maxPlayersPerTable()/*tableDraw.maxPlayersPerTable*/).fill('').map((_, i) => i);

            for (let j = 0; j < minPlayersPerTable; j++) {
                const seat = seats.sort(() => 0.5 - Math.random())[0];

                table.seats.push(this.getTbdTableDrawSeat(i, seat, j === 0));
                seats = seats.filter((i: number) => i !== seat);
            }

            if (additionalPlayers > 0) {
                const seat = seats.sort(() => 0.5 - Math.random())[0];

                table.seats.push(this.getTbdTableDrawSeat(i, seat, false));
                seats = seats.filter((i: number) => i !== seat);

                additionalPlayers--;
            }

            if (minPlayersPerTable > 0) {
                tableDraw.step = TableDrawStep.SET_UP;
            }

            if (seats.length > 0) {
                seats.forEach((seat: number) => table.seats.push({
                    table: i,
                    seatNo: seat,
                    player: {...this.EMPTY_SEAT},
                    isEliminated: false,
                    isFixedSeat: false,
                    isButton: false,
                    isSelectVisible: false,
                    isPlaceholder: true
                }));
            }

            tableDraw.tables.push(table);
        }

        tableDraw.tables = tableDraw.tables.map(
            (table: TableDrawTable) => ({
                tableName: table.tableName,
                seats: [...table.seats.sort((a, b) => a.seatNo - b.seatNo)]
            })
        );

        this.tableDraw.set({...tableDraw});

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
        }

        if (this.autoDraw() && tableDraw.step === TableDrawStep.SET_UP) {
            this.confirmSetup();
        }
    }

    private getTbdTableDrawSeat(table: number, seatNo: number, isButton: boolean): TableDrawSeat {
        return {
            player: {
                name: 'tbd',
                image: '',
                id: -1,
                locked: false
            },
            isButton,
            table: table,
            seatNo: seatNo,
            isFixedSeat: false,
            isSelectVisible: false,
            isEliminated: false,
            isPlaceholder: false
        };
    }

    confirmSetup(): void {
        this.tableDraw.update(
            (tableDraw: TableDraw | undefined) => tableDraw
                ? ({
                    ...tableDraw,
                    step: TableDrawStep.SET_UP_CONFIRMED
                })
                : undefined
        );

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(
                take(1)
            ).subscribe();
        }

        if (this.autoDraw()) {
            this.drawPlayers();
        }
    }

    loadExistingDrawAndCheck(tableDraw: TableDraw): void {
        const fixedSeats: number[] = [];

        tableDraw.tables.forEach((table: TableDrawTable) => {
            table.seats.forEach(
                (seat: TableDrawSeat) => {
                    if (seat.isFixedSeat) {
                        fixedSeats.push(seat.player.id);
                    }
                }
            );
        });

        const randomPlayers = this.shuffle(tableDraw.players);

        tableDraw.availablePlayers = [
            ...randomPlayers.filter(
                (player: Player) => !fixedSeats.includes(player.id) && !tableDraw.finishedPlayerIds.includes(player.id)
            )
        ];

        const eliminatedPlayers = tableDraw.players.filter(
            (player: Player) => tableDraw.finishedPlayerIds.includes(player.id)
        );

        tableDraw.tables.forEach(
            (table: TableDrawTable) => table.seats.forEach(
                (seat: TableDrawSeat) => seat.isEliminated = eliminatedPlayers.map(a => a.id).includes(seat.player?.id)
            )
        );

        const numberOfRemainingPlayersPerTable: number[] = [];

        tableDraw.tables.forEach(
            (table: TableDrawTable) => {
                numberOfRemainingPlayersPerTable.push(
                    table.seats.filter(
                        (seat: TableDrawSeat) => !seat.isEliminated && !seat.isPlaceholder
                    ).length
                );
            });

        const min = Math.min(...numberOfRemainingPlayersPerTable);
        const max = Math.max(...numberOfRemainingPlayersPerTable);

        if (max - min > 1) {
            tableDraw.action = TableDrawAction.PLAYER_HAS_TO_BE_MOVED;
            tableDraw.noOfPlayersToMove = Math.floor((max - min) / 2);

            tableDraw.tableIndexToTake = tableDraw.tables.indexOf(
                tableDraw.tables.filter((table: TableDrawTable) => table.seats.filter(
                    (seat: TableDrawSeat) => !seat.isEliminated && !seat.isPlaceholder
                ).length === max)[0]
            );

            tableDraw.tableIndexToAdd = tableDraw.tables.indexOf(
                tableDraw.tables.filter((table: TableDrawTable) => table.seats.filter(
                    (seat: TableDrawSeat) => !seat.isEliminated && !seat.isPlaceholder
                ).length === min)[0]
            );
        }

        const availableSeats = tableDraw.tables.length * this.maxPlayersPerTable()/*tableDraw.maxPlayersPerTable*/;

        const freeSeats = tableDraw.tables.map(
            (table: TableDrawTable) => table.seats
        ).flat().filter(
            (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
        ).length;

        const remainingPlayers = this.flatten(
            tableDraw.tables.map((table: TableDrawTable) => table.seats)
        ).filter(
            (seat: TableDrawSeat) => !seat.isEliminated && !seat.isPlaceholder
        ).length;

        if (
            (availableSeats - remainingPlayers) >= this.maxPlayersPerTable()/*tableDraw.maxPlayersPerTable*/
            && tableDraw.step === TableDrawStep.DRAWN
        ) {
            tableDraw.action = TableDrawAction.TABLE_CAN_BE_ELIMINATED;
        }

        const drawnPlayerIds = tableDraw.tables?.map(
            (table: TableDrawTable) => table.seats
        ).flat().filter(
            (seat: TableDrawSeat) => !seat.isPlaceholder
        ).map(
            (seat: TableDrawSeat) => seat.player.id
        );

        tableDraw.newPlayers = [];

        this.players().forEach((player: Player) => {
            if (
                !drawnPlayerIds.includes(player.id)
                && !tableDraw.finishedPlayerIds.includes(player.id)
            ) {
                tableDraw.newPlayers.push(player);
            }
        });

        if (tableDraw.newPlayers.length > 0) {
            tableDraw.action = TableDrawAction.NEW_PLAYERS_TO_DRAW;
        }

        if (freeSeats < tableDraw.newPlayers.length && tableDraw.step === TableDrawStep.DRAWN) {
            tableDraw.action = TableDrawAction.TOO_MANY_PLAYERS_FOR_AVAILABLE_SEATS;

            const numberOfPlayersToWaitingList = tableDraw.newPlayers.length - freeSeats;

            for (let i = 0; i < numberOfPlayersToWaitingList; i++) {
                const player = tableDraw.newPlayers.pop();

                if (
                    player
                    && tableDraw.waitingList.filter((player: Player) => player.id === player.id).length === 0
                ) {
                    tableDraw.waitingList.push(player);
                }
            }
        }

        if (this.persistDrawToDb()) {
            this.tournamentApiService.postTableDraw$(tableDraw).pipe(
                take(1)
            ).subscribe();
        }

        this.tableDraw.set({...tableDraw});

        if (this.autoDraw()) {
            switch (tableDraw.action) {
                case TableDrawAction.PLAYER_HAS_TO_BE_MOVED:
                    this.movePlayer();
                    break;

                case TableDrawAction.NEW_PLAYERS_TO_DRAW:
                case TableDrawAction.TOO_MANY_PLAYERS_FOR_AVAILABLE_SEATS:
                    this.distributeNewPlayers();
                    break;

                case TableDrawAction.TABLE_CAN_BE_ELIMINATED:
                    if (this.autoEliminate()) {
                        this.eliminateTable();
                    }
                    break;
            }
        }
    }

    addFixedSeat(table: number, seat: number, player: Player): void {
        this.tableDraw.update((tableDraw: TableDraw | undefined) => {
            if (tableDraw !== undefined) {
                tableDraw.tables[table].seats[seat].isFixedSeat = true;
                tableDraw.tables[table].seats[seat].player = player;
                tableDraw.tables[table].seats[seat].isSelectVisible = false;
                tableDraw.availablePlayers = tableDraw.availablePlayers.filter(p => p.id !== player.id);

                return {...tableDraw};
            }

            return undefined;
        });

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(
                take(1)
            ).subscribe();
        }
    }

    drawPlayers(): void {
        let index = 0;

        this.tableDraw.update((tableDraw: TableDraw | undefined) => {
            if (tableDraw !== undefined) {
                tableDraw.availablePlayers = this.shuffle(tableDraw.availablePlayers);
                tableDraw.step = TableDrawStep.DRAWN;

                for (let i = 0; i < tableDraw.tables.length; i++) {
                    for (let j = 0; j < tableDraw.tables[i].seats.length; j++) {
                        if (
                            !tableDraw.tables[i].seats[j].isFixedSeat
                            && !tableDraw.tables[i].seats[j].player.name.includes('----') // TODO check placeholder
                        ) {
                            tableDraw.tables[i].seats[j].player = tableDraw.availablePlayers[index];

                            tableDraw.events.push({
                                time: new Date(),
                                type: TableDrawEventType.ADDED_PLAYER,
                                read: false,
                                message: `Player ${tableDraw.availablePlayers[index].name} was seated on ${tableDraw.tables[i].tableName} Seat ${j + 1}`
                            });

                            index++;
                        }
                    }
                }

                return {...tableDraw};
            }

            return undefined;
        });

        this.tableDraw.update(
            (tableDraw: TableDraw | undefined) => tableDraw
                ? ({
                    ...tableDraw,
                    step: TableDrawStep.DRAWN
                })
                : undefined
        );

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
        }
    }

    movePlayer(): void {
        this.tableDraw.update((tableDraw: TableDraw | undefined) => {
            if (tableDraw !== undefined) {

                tableDraw.playersToMove = this.shuffle(
                    [...tableDraw.tables[tableDraw.tableIndexToTake].seats.filter(
                        (seat: TableDrawSeat) => !seat.isPlaceholder && !seat.isFixedSeat
                    )]
                ).slice(0, tableDraw.noOfPlayersToMove);

                const indexes: number[] = [];

                for (let i = 0; i < tableDraw.tables[tableDraw.tableIndexToTake].seats.length; i++) {
                    const playerIds = tableDraw.playersToMove.map((seat: TableDrawSeat) => seat.player.id);
                    const playerIdToTake = tableDraw.tables[tableDraw.tableIndexToTake].seats[i].player.id;

                    if (playerIds.includes(playerIdToTake)) {
                        indexes.push(i);
                    }
                }

                indexes.forEach((index: number) => {
                    tableDraw.tables[tableDraw.tableIndexToTake].seats[index] = {
                        ...tableDraw.tables[tableDraw.tableIndexToTake].seats[index],
                        isPlaceholder: true,
                        isEliminated: false,
                        player: this.EMPTY_SEAT,
                    };
                });

                const newSeats = this.getRandomFreeSeatIndexes(tableDraw, indexes.length);

                const indexesOfNewSeats: number[] = [];

                for (let i = 0; i < tableDraw.tables[tableDraw.tableIndexToAdd].seats.length; i++) {
                    if (newSeats.includes(tableDraw.tables[tableDraw.tableIndexToAdd].seats[i].seatNo)) {
                        indexesOfNewSeats.push(i);
                    }
                }

                for (let i = 0; i < indexes.length; i++) {
                    tableDraw.events.push({
                        time: new Date(),
                        type: TableDrawEventType.MOVED_PLAYER,
                        message: `Player ${tableDraw.playersToMove[i].player.name} moved from ${tableDraw.tables[tableDraw.tableIndexToTake].tableName} to ${tableDraw.tables[tableDraw.tableIndexToAdd].tableName} Seat ${indexesOfNewSeats[i] + 1}`,
                        read: false
                    });

                    tableDraw.tables[tableDraw.tableIndexToAdd].seats[indexesOfNewSeats[i]] = {
                        ...tableDraw.playersToMove[i],
                        seatNo: newSeats[i],
                        isPlaceholder: false,
                        isEliminated: false
                    };
                }

                tableDraw.tables = tableDraw.tables.map(
                    t => ({
                        tableName: t.tableName,
                        seats: t.seats.sort((a, b) => a.seatNo - b.seatNo)
                    })
                );

                for (let i = 0; i < tableDraw.tables.length; i++) {
                    for (let j = 0; j < tableDraw.tables[i].seats.length; j++) {
                        if (tableDraw.tables[i].seats[j].isEliminated) {
                            tableDraw.tables[i].seats[j] = {
                                ...tableDraw.tables[i].seats[j],
                                player: this.EMPTY_SEAT,
                                isEliminated: false,
                                isPlaceholder: true
                            };
                        }
                    }
                }

                tableDraw.action = TableDrawAction.NONE;

                return {...tableDraw};
            }

            return undefined;
        });

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(
                take(1)
            ).subscribe();
        }

        if (this.autoDraw()) {
            this.playerMoved();
        }
    }

    distributeNewPlayers(): void {
        if (this.tableDraw() !== undefined) {
            const amountOfOpenSeats = this.tableDraw()!.tables.map(
                (table: TableDrawTable) => table.seats
            ).flat().filter(
                (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
            ).length;

            if (this.newPlayers().length <= amountOfOpenSeats) {
                this.tableDraw.update((tableDraw: TableDraw | undefined) => {
                    if (tableDraw !== undefined) {
                        let addedPlayers = 0;

                        let tableWithMostOpenSeatsIndex = 0;
                        const maxOpenSeats = tableDraw!.tables[0].seats.filter(
                            (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
                        ).length;

                        tableDraw.tables.forEach((table, index) => {
                            const numberOfOpenSeats = table.seats.filter(
                                (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
                            ).length;

                            if (numberOfOpenSeats > maxOpenSeats) {
                                tableWithMostOpenSeatsIndex = index;
                            }
                        });

                        while (addedPlayers < this.newPlayers().length) {
                            const tableIndex = (tableWithMostOpenSeatsIndex + addedPlayers) % tableDraw.tables.length;

                            const openSeats = tableDraw.tables[tableIndex].seats.filter(
                                (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
                            );

                            const seatIndex = tableDraw.tables[tableIndex].seats.indexOf(this.shuffle(openSeats)[0]);
                            const player = this.newPlayers()[addedPlayers];

                            tableDraw.tables[tableIndex].seats[seatIndex].player = player;
                            tableDraw.tables[tableIndex].seats[seatIndex].isPlaceholder = false;
                            tableDraw.tables[tableIndex].seats[seatIndex].isEliminated = false;

                            tableDraw.events.push({
                                time: new Date(),
                                type: TableDrawEventType.ADDED_PLAYER,
                                message: `Player ${player.name} put to table ${tableDraw.tables[tableIndex].tableName}, seat ${seatIndex + 1}`,
                                read: false
                            });

                            tableDraw.waitingList = tableDraw.waitingList.filter(
                                (player: Player) => player.id !== this.newPlayers()[addedPlayers].id
                            );

                            addedPlayers++;
                        }

                        tableDraw.newPlayers = [];

                        tableDraw.step = TableDrawStep.DRAWN;

                        return {...tableDraw};
                    }

                    return undefined;
                });

                if (this.persistDrawToDb()) {
                    this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
                }
            } else {
                // create new table
                console.log('CRETAE');
            }
        }
    }

    getRandomFreeSeatIndexes(tableDraw: TableDraw, noOfSeats: number): number[] {
        // TODO refactor
        const numberOfFreeSeats = tableDraw.tables[tableDraw.tableIndexToAdd].seats.map(
            (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
        ).length;

        if (noOfSeats > numberOfFreeSeats) {
            throw new Error('index out of bounds bro');
        }

        const table = tableDraw.tables[tableDraw.tableIndexToAdd];

        return this.shuffle(
            table.seats.filter(
                (seat: TableDrawSeat) => seat.isPlaceholder || seat.isEliminated
            ).map(
                (seat: TableDrawSeat) => seat.seatNo
            )
        ).slice(0, noOfSeats);
    }

    eliminateTable(): void {
        this.tableDraw.update((tableDraw: TableDraw | undefined) => {
            if (tableDraw !== undefined) {
                let maxPlayers = 999;
                let tableToEliminateIndex = 0;

                for (let i = 0; i < tableDraw.tables.length; i++) {
                    if (tableDraw.tables[i].seats.filter(e => !e.isPlaceholder && !e.isEliminated).length < maxPlayers) {
                        maxPlayers = tableDraw.tables[i].seats.filter(e => !e.isPlaceholder && !e.isEliminated).length;
                        tableToEliminateIndex = i;

                    }
                }

                tableDraw.events.push({
                    time: new Date(),
                    type: TableDrawEventType.ELIMINATED_TABLE,
                    message: `${tableDraw.tables[tableToEliminateIndex].tableName} was eliminated.`,
                    read: false
                });

                const playersToDistribute = this.shuffle([...tableDraw.tables[tableToEliminateIndex].seats].filter(e => !e.isEliminated && !e.isPlaceholder));

                // check table with less players to start add

                let tableIndex = 0;
                maxPlayers = 999;

                for (let i = 0; i < tableDraw.tables.length; i++) {
                    if (i !== tableToEliminateIndex && tableDraw.tables[i].seats.filter(e => !e.isPlaceholder && !e.isEliminated).length < maxPlayers) {
                        maxPlayers = tableDraw.tables[i].seats.filter(e => !e.isPlaceholder && !e.isEliminated).length;
                        tableIndex = i;
                    }
                }

                playersToDistribute.forEach((tableDrawSeat: TableDrawSeat) => {
                    let index = tableIndex;

                    if (index === tableToEliminateIndex) {
                        index = (index + 1) % tableDraw.tables.length;
                    }

                    let seatIndex = tableDraw.tables[index].seats.findIndex(e => e.isPlaceholder || e.isEliminated);

                    tableDraw.events.push({
                        time: new Date(),
                        type: TableDrawEventType.MOVED_PLAYER,
                        message: `Player ${tableDrawSeat.player.name} was moved to ${tableDraw.tables[index].tableName} Seat ${seatIndex + 1}`,
                        read: false
                    });

                    tableDraw.tables[index].seats[seatIndex] = {
                        ...tableDraw.tables[index].seats[seatIndex],
                        isPlaceholder: false,
                        isEliminated: false,
                        isButton: false,
                        player: {...tableDrawSeat.player}
                    };
                });

                tableDraw.tables = [...tableDraw.tables.filter((e, i) => i !== tableToEliminateIndex)];
                tableDraw.action = TableDrawAction.NONE;

                return {...tableDraw};
            }

            return undefined;
        });

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
        }
    }

    dontEliminateTable(): void {
        this.tableDraw.update((tableDraw: TableDraw | undefined) => {
            if (tableDraw !== undefined) {
                tableDraw.action = TableDrawAction.NONE;

                return {...tableDraw};
            }

            return undefined;
        });

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
        }
    }

    shuffle<T>(array: T[]): T[] {
        const result = [], itemsLeft = array.concat([]);

        while (itemsLeft.length) {
            const randomIndex = Math.floor(Math.random() * itemsLeft.length);
            const [randomItem] = itemsLeft.splice(randomIndex, 1);
            result.push(randomItem);
        }

        return result;
    }

    flatten<T>(arr: T[][]): T[] {
        return ([] as T[]).concat(...arr);
    }

    resetTableDraw(): void {
        this.tableDraw.update(
            (tableDraw: TableDraw | undefined) => tableDraw
                ? ({
                    ...tableDraw,
                    tables: [],
                    step: TableDrawStep.BLANK,
                    tableHasToBeEliminated: false,
                    playerHasToBeMoved: false,
                    playersToMove: undefined
                })
                : undefined
        );

        this.setupEmptyTables();

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
        }
    }

    playerMoved(): void {
        this.tableDraw.update((tableDraw: TableDraw | undefined) => tableDraw
            ? ({
                ...tableDraw,
                playersToMove: undefined
            })
            : undefined
        );

        if (this.persistDrawToDb() && this.tableDraw() !== undefined) {
            this.tournamentApiService.postTableDraw$(this.tableDraw()!).pipe(take(1)).subscribe();
        }
    }
}
