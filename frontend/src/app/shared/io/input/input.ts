import { Component, input, output } from "@angular/core";
import { coerceNumber, coerceString } from "../../utils/coerce.utils";
import { BaseHTMLElementPropertiesComponent } from "../../base-html-element-properties";

@Component({
  selector:    'app-input',
  standalone:  true,
  imports:     [],
  templateUrl: './input.html',
  styleUrl:    './input.scss',
})
export class InputComponent extends BaseHTMLElementPropertiesComponent {

  // ── Value ──
  value = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Button ──
  rows = input(1, { transform: (v: unknown) => coerceNumber(v, 1) });
  placeholder = input('', { transform: (v: unknown) => coerceString(v) });
  valueChanged = output<string>();
  blured = output<void>();

  // ── Actions ──
  valueChange(v: string): void { this.valueChanged.emit(coerceString(v)); }
  blur(): void { this.blured.emit(); }

}