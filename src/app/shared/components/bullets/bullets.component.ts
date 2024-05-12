import { Component, computed, input } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
    selector: 'app-bullets',
    templateUrl: './bullets.component.html',
    styleUrls: ['./bullets.component.scss'],
    standalone: true,
    imports: [NgFor]
})
export class BulletsComponent {

    number = input.required<number>();
    bulletClass = input<string>('fa-circle');

    numberArray = computed(() => new Array(this.number()));

}
