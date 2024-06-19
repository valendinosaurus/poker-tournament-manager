import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'time',
    standalone: true,
})
export class TimePipe implements PipeTransform {
    transform(value: number): string {
        console.log('value 1', value);

        const hours = Math.floor(value / 3600);
        value = value - hours * 3600;
        console.log('value 2', value);
        const secondsLeft = value % 60;
        const minutes = (value - secondsLeft) / 60;

        const secondsLeftString =
            secondsLeft < 10 ? `0${secondsLeft}` : `${secondsLeft}`;

        const minutesLeftString =
            hours > 0 && minutes < 10 ? `0${minutes}` : `${minutes}`;

        if (hours > 0) {
            return `${hours}:${minutesLeftString}:${secondsLeftString}`;
        }

        return `${minutes}:${secondsLeftString}`;
    }
}
