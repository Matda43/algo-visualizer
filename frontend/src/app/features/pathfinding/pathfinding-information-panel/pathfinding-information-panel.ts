import { Component, input } from '@angular/core';
import { PathfindingMetadata } from '../models/pathfinding.models';

@Component({
  selector:    'app-pathfinding-information-panel',
  standalone:  true,
  imports:     [],
  templateUrl: './pathfinding-information-panel.html',
  styleUrl:    './pathfinding-information-panel.scss',
})
export class PathfindingInformationPanelComponent {
  metadata = input.required<PathfindingMetadata>();
}