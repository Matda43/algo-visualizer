import { Component, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AlgoInstance } from '../models/sorting.models';
import { SortingBarComponent } from '../sorting-bar/sorting-bar';
import { NumberCellComponent } from '../number-cell/number-cell';
import { StatBadgeComponent } from '../../../shared/stat-badge/stat-badge';

@Component({
  selector:    'app-viz-instance',
  standalone:  true,
  imports:     [DecimalPipe, SortingBarComponent, NumberCellComponent, StatBadgeComponent],
  templateUrl: './viz-instance.html',
  styleUrl:    './viz-instance.scss',
})
export class VizInstanceComponent {
  instance  = input.required<AlgoInstance>();
  viewMode  = input.required<'bars' | 'numbers'>();
  dataType  = input.required<string>();
  arraySize = input.required<number>();

  unsortedCount = computed(() => this.arraySize() - this.instance().sortedIndices.size);

  hasNegatives = computed(() => this.instance().bars.some(bar => bar.value < 0));

  yTicks = computed((): { value: number; pct: number }[] => {
    const bars = this.instance().bars;
    if (!bars.length) return [];
    const values = bars.map(bar => bar.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values, 1);
    const total  = maxVal - minVal;
    if (total === 0) return [];
    const tickCount = 5;
    const step = total / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, index) => {
      const value = minVal + step * index;
      const pct   = ((value - minVal) / total) * 100;
      return { value: parseFloat(value.toFixed(1)), pct };
    });
  });

  barLayout(value: number): { height: number; bottom: number } {
    const bars = this.instance().bars;
    if (!bars.length) return { height: 0, bottom: 0 };
    const values = bars.map(bar => bar.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values, 1);
    const total  = maxVal - minVal;
    if (total === 0) return { height: 0, bottom: 50 };
    const zeroPct   = this.hasNegatives() ? (-minVal / total) * 100 : 0;
    const heightPct = (Math.abs(value) / total) * 100;
    const bottomPct = value >= 0 ? zeroPct : zeroPct - heightPct;
    return { height: heightPct, bottom: bottomPct };
  }

  isZeroTick(value: number): boolean {
    return Math.abs(value) < 0.01;
  }
}