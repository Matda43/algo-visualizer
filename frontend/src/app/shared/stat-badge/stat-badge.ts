import { Component, input } from '@angular/core';

export type StatColor = 'compare' | 'swap' | 'pivot' | 'sorted' | 'unsorted' | 'neutral';

@Component({
  selector: 'app-stat-badge',
  standalone: true,
  templateUrl: './stat-badge.html',
  styleUrl: './stat-badge.scss',
})
export class StatBadgeComponent {
  label = input.required<string>();
  value = input.required<number | string>();
  color = input<StatColor>('neutral');
}