import { Component, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AlgoInstance, Bar } from '../models/sorting.models';
import { SortingBarComponent } from '../sorting-bar/sorting-bar';
import { NumberCellComponent } from '../number-cell/number-cell';

@Component({
  selector: 'app-viz-instance',
  standalone: true,
  imports: [DecimalPipe, SortingBarComponent, NumberCellComponent],
  templateUrl: './viz-instance.html',
  styleUrl: './viz-instance.scss'
})
export class VizInstanceComponent {
  instance = input.required<AlgoInstance>();
  viewMode = input.required<'bars' | 'numbers'>();
  dataType = input.required<string>();

  arraySize = input.required<number>();

  unsortedCount = computed(() => this.arraySize() - this.instance().sortedIndices.size);

  maxValue = computed(() => {
    const bars = this.instance().bars;
    if (!bars.length) return 1;
    return Math.max(...bars.map(b => b.value).map(Math.abs), 1);
  });

  hasNegatives = computed(() => this.instance().bars.some(b => b.value < 0));

  yTicks = computed((): { value: number; pct: number }[] => {
    const bars = this.instance().bars;
    if (!bars.length) return [];
    const vals   = bars.map(b => b.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals, 1);
    const total  = maxVal - minVal;
    if (total === 0) return [];
    const tickCount = 5;
    const step = total / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const value = minVal + step * i;
      const pct   = ((value - minVal) / total) * 100;
      return { value: parseFloat(value.toFixed(1)), pct };
    });
  });

  barLayout(val: number): { height: number; bottom: number } {
    const bars = this.instance().bars;
    if (!bars.length) return { height: 0, bottom: 0 };
    const vals   = bars.map(b => b.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals, 1);
    const total  = maxVal - minVal;
    if (total === 0) return { height: 0, bottom: 50 };
    const zeroPct   = this.hasNegatives() ? (-minVal / total) * 100 : 0;
    const heightPct = (Math.abs(val) / total) * 100;
    const bottomPct = val >= 0 ? zeroPct : zeroPct - heightPct;
    return { height: heightPct, bottom: bottomPct };
  }

  isZeroTick(value: number): boolean {
    return Math.abs(value) < 0.01;
  }
}