import { Component, input, output } from "@angular/core";
import { clampNumber, coerceBoolean, coerceNumber, coerceString } from "../../../utils/coerce.utils";
import { BaseHTMLElementPropertiesComponent } from "../../../base-html-element-properties";

@Component({
  selector:    'app-number-input',
  standalone:  true,
  imports:     [],
  templateUrl: './number-input.html',
  styleUrl:    './number-input.scss',
})
export class NumberInputComponent extends BaseHTMLElementPropertiesComponent {

  // ── Decrement ──
  canDec = input(false, { transform: coerceBoolean });
  decDisabled = input(false, { transform: coerceBoolean });
  decClicked = output<void>();
  decTitle = input('Décrémenter', { transform: (v: unknown) => coerceString(v, 'Décrémenter') });

  // ── Value ──
  value = input(0, { transform: (v: unknown) => coerceNumber(v) });
  valueMin = input(Number.MIN_VALUE, { transform: (v: unknown) => coerceNumber(v, Number.MIN_VALUE) });
  valueMax = input(Number.MAX_VALUE, { transform: (v: unknown) => coerceNumber(v, Number.MAX_VALUE) });
  valueDisabled = input(false, { transform: coerceBoolean });
  valueChanged = output<number>();
  valueStyle = input('', { transform: (v: unknown) => coerceString(v) })

  // ── Increment ──
  canInc = input(false, { transform: coerceBoolean });
  incDisabled = input(false, { transform: coerceBoolean });
  incClicked = output<void>();
  incTitle = input('Incrémenter', { transform: (v: unknown) => coerceString(v, 'Incrémenter') });

  // ── Actions ──
  decClick(): void { this.decClicked.emit(); }
  valueChange(v: number): void { this.valueChanged.emit(clampNumber(coerceNumber(v), this.valueMin(), this.valueMax())); }
  incClick(): void { this.incClicked.emit(); }

}