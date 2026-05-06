import { Component, input } from '@angular/core';
import { AlgoMetadata } from '../../features/sorting/models/algo-metadata.model';

@Component({
  selector: 'app-complexity-grid',
  standalone: true,
  templateUrl: './complexity-grid.html',
  styleUrl: './complexity-grid.scss',
})
export class ComplexityGridComponent {
  metadata = input.required<AlgoMetadata>();
}