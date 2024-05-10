import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'rank',
    standalone: true
})
export class RankPipe implements PipeTransform {

    transform(rank: number): string {
        switch (rank) {
            case 1:
                return `1st`;
            case 2:
                return '2nd';
            case 3:
                return '3rd';
            default:
                return `${rank}th`;
        }
    }

}
