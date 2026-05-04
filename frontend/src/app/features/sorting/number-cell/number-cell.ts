import { Component, input } from '@angular/core';
import { Bar } from '../models/sorting.models';

@Component({
  selector: 'app-number-cell',
  standalone: true,
  imports: [],
  templateUrl: './number-cell.html',
  styleUrl: './number-cell.scss'
})
export class NumberCellComponent {
  bar      = input.required<Bar>();
  dataType = input.required<string>();

  formatValue(v: number): string {
    if (this.dataType() === 'float')  return v.toFixed(2);
    if (this.dataType() === 'double') return v.toFixed(4);
    if (this.dataType() === 'long')   return v.toString() + 'L';
    return Math.round(v).toString();
  }
}