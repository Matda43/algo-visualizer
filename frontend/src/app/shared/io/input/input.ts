import { Component, input, output } from "@angular/core";
import { coerceBoolean, coerceNumber, coerceString } from "../../utils/coerce.utils";

@Component({
  selector:    'app-input',
  standalone:  true,
  imports:     [],
  templateUrl: './input.html',
  styleUrl:    './input.scss',
})
export class InputComponent {

  // ── Label ──
  label = input('', { transform: (v: unknown) => coerceString(v) });
  title = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Value ──
  value = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Button ──
  rows = input(1, { transform: (v: unknown) => coerceNumber(v, 1) });
  disabled = input(false, { transform: coerceBoolean });
  placeholder = input('', { transform: (v: unknown) => coerceString(v) });
  valueChanged = output<string>();
  blured = output<void>();

  // ── Actions ──
  valueChange(v: string): void { this.valueChanged.emit(coerceString(v)); }
  blur(): void { this.blured.emit(); }

}