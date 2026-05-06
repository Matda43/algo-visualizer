import { Component, input } from '@angular/core';
import { Bar } from '../models/sorting.models';

@Component({
  selector: 'app-sorting-bar',
  standalone: true,
  templateUrl: './sorting-bar.html',
  styleUrl: './sorting-bar.scss'
})
export class SortingBarComponent {
  bar    = input.required<Bar>();
  height = input.required<number>();
  bottom = input.required<number>();
}