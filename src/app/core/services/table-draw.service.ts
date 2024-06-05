import { inject, Injectable } from '@angular/core';
import { LocalStorageService } from './util/local-storage.service';
import { TableDrawSeat } from '../../shared/models/table-draw-seat.interface';
import { Player } from '../../shared/models/player.interface';
import { TableDraw } from '../../shared/models/table-draw.interface';
import { Tournament } from '../../shared/models/tournament.interface';
import { TableDrawState } from '../../shared/enums/table-draw-state.enum';

@Injectable({
    providedIn: 'root'
})
export class TableDrawService {

    randomPlayers: Player[];

    emptySeatPlayer: Player = {
        name: '----',
        image: '',
        id: -1,
        locked: false
    };

    private localStorageService: LocalStorageService = inject(LocalStorageService);

    setupEmptyTables(tournament: Tournament, maxPlayersPerTable: number): TableDraw {

        const tableDraw: TableDraw = {
            tournament: tournament,
            state: TableDrawState.BLANK,
            tables: [],
            maxPlayersPerTable: maxPlayersPerTable,
            availablePlayers: [...tournament.players],
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

        this.localStorageService.saveTableDraw(tableDraw);

        return {...tableDraw};
    }

    loadExistingDrawAndCheck(tableDraw: TableDraw): TableDraw {
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

        console.log('eliminated', eliminatedPlayers);

        tableDraw.tables.forEach(
            t => t.forEach(
                p => {
                    if (eliminatedPlayers.map(a => a.id).includes(p.player.id)) {
                        console.log('setting eliminated');
                        p.eliminated = true;
                    }
                }
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
        console.log('has tp be moved', tableDraw.playerHasToBeMoved);

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

        this.localStorageService.saveTableDraw(tableDraw);

        return tableDraw;
    }

    addFixedSeat(table: number, seat: number, player: Player, tableDraw: TableDraw): Player[] {
        tableDraw.tables[table][seat].fixSeat = true;
        tableDraw.tables[table][seat].player = player;
        tableDraw.tables[table][seat].selectVisible = false;
        this.localStorageService.saveTableDraw(tableDraw);
        tableDraw.availablePlayers = tableDraw.availablePlayers.filter(p => p.id !== player.id);

        return [...tableDraw.availablePlayers];
    }

    drawPlayers(tableDraw: TableDraw): TableDraw {
        let index = 0;

        tableDraw.availablePlayers = this.shuffle(tableDraw.availablePlayers);

        for (let i = 0; i < tableDraw.tables.length; i++) {
            for (let j = 0; j < tableDraw.tables[i].length; j++) {
                if (!tableDraw.tables[i][j].fixSeat && !tableDraw.tables[i][j].player.name.includes('----')) {
                    tableDraw.tables[i][j].player = tableDraw.availablePlayers[index];
                    index++;
                }
            }
        }

        this.localStorageService.saveTableDraw(tableDraw);

        return {...tableDraw};
    }

    movePlayer(tableDraw: TableDraw): TableDraw {
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

        this.localStorageService.saveTableDraw(tableDraw);

        return tableDraw;
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

    eliminateTable(tableDraw: TableDraw): TableDraw {
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

        this.localStorageService.saveTableDraw(tableDraw);

        return {...tableDraw};
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

    resetTableDraw(tId: number): void {
        this.localStorageService.resetTableDraw(tId);
    }
}
