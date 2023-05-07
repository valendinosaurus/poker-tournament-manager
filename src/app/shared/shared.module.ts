import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TimePipe } from './pipes/time.pipe';

@NgModule({
  declarations: [TimePipe],
  imports: [CommonModule],
  exports: [TimePipe],
})
export class SharedModule {}
