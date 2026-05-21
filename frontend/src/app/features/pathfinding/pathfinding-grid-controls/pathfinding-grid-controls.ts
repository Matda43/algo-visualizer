import { Component, input, model, output } from '@angular/core';
import { coerceBoolean, coerceNumber } from '../../../shared/utils/coerce.utils';
import { ToggleSwitchComponent } from '../../../shared/toggle-switch/toggle-switch';
import { NumberInputComponent } from '../../../shared/io/input/number-input/number-input';
import { CharacterButtonComponent } from '../../../shared/button/character-button/character-button';

@Component({
  selector:    'app-pathfinding-grid-controls',
  standalone:  true,
  imports:     [ToggleSwitchComponent, NumberInputComponent, CharacterButtonComponent],
  templateUrl: './pathfinding-grid-controls.html',
  styleUrl:    './pathfinding-grid-controls.scss',
})
export class PathfindingGridControlsComponent {

  // ── État partagé (two-way) ─────────────────────────────────────────────────
  allowDiagonal = model<boolean>(false);

  // ── Lignes ────────────────────────────────────────────────────────────────
  rows    = input.required<number>();
  rowsMin = input(5,   { transform: (v: unknown) => coerceNumber(v, 5)   });
  rowsMax = input(60,  { transform: (v: unknown) => coerceNumber(v, 60)  });
  rowsChanged = output<number>();

  // ── Colonnes ──────────────────────────────────────────────────────────────
  cols    = input.required<number>();
  colsMin = input(5,   { transform: (v: unknown) => coerceNumber(v, 5)   });
  colsMax = input(100, { transform: (v: unknown) => coerceNumber(v, 100) });
  colsChanged = output<number>();

  // ── Désactivation globale ─────────────────────────────────────────────────
  disabled = input(false, { transform: (v: unknown) => coerceBoolean(v) });

  // ── Actions grille ────────────────────────────────────────────────────────
  resetClicked = output<void>();
  clearClicked = output<void>();
  mazeClicked  = output<void>();

  // ── Incréments ────────────────────────────────────────────────────────────
  decrementRows(): void { this.rowsChanged.emit(Math.max(this.rowsMin(), this.rows() - 1)); }
  incrementRows(): void { this.rowsChanged.emit(Math.min(this.rowsMax(), this.rows() + 1)); }
  decrementCols(): void { this.colsChanged.emit(Math.max(this.colsMin(), this.cols() - 1)); }
  incrementCols(): void { this.colsChanged.emit(Math.min(this.colsMax(), this.cols() + 1)); }
}