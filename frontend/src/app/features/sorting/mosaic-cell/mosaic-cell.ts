import { Component, input, computed } from '@angular/core';
import { Bar } from '../models/sorting.models';

@Component({
  selector: 'app-mosaic-cell',
  standalone: true,
  templateUrl: './mosaic-cell.html',
  styleUrl: './mosaic-cell.scss',
})
export class MosaicCellComponent {
  bar      = input.required<Bar>();
  minValue = input.required<number>();
  maxValue = input.required<number>();

  /**
   * Interpole entre #eb4759 (valeur min) et #292929 (valeur max).
   * Les états actifs (compare/swap/pivot) ajoutent un contour via CSS.
   */
  cellColor = computed((): string => {
    const range = this.maxValue() - this.minValue();
    const t     = range === 0 ? 0 : (this.bar().value - this.minValue()) / range;

    // #eb4759 → r=235, g=71,  b=89
    // #292929 → r=41,  g=41,  b=41
    const r = Math.round(235 + (41 - 235) * t);
    const g = Math.round(71  + (41 - 71)  * t);
    const b = Math.round(89  + (41 - 89)  * t);

    return `rgb(${r}, ${g}, ${b})`;
  });
}