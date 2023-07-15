import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent {

    @Input() running: boolean;
    @Input() withRebuy: boolean;
    @Input() withAddon: boolean;
    @Input() isSimpleTournament: boolean;

    isOverlayOpen = false;

    @Output() createPlayer = new EventEmitter<void>();
    @Output() addPlayer = new EventEmitter<void>();
    @Output() addRebuy = new EventEmitter<void>();
    @Output() addAddon = new EventEmitter<void>();
    @Output() seatOpen = new EventEmitter<void>();
    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();

}
