import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time',
})
export class TimePipe implements PipeTransform {
  transform(value: number): string {
    const secondsLeft = value % 60;
    const minutes = (value - secondsLeft) / 60;

    const secondsLeftString =
      secondsLeft < 10 ? `0${secondsLeft}` : `${secondsLeft}`;

    return `${minutes}:${secondsLeftString}`;
  }
}
