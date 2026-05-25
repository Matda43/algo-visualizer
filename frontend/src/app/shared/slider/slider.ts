import { Component, input, output } from "@angular/core";
import { clampNumber, coerceNumber, coerceString } from "../utils/coerce.utils";
import { BaseHTMLElementPropertiesComponent } from "../base-html-element-properties";

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [],
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
})
export class SliderComponent extends BaseHTMLElementPropertiesComponent {

  // ── Label ──
  description = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Value ──
  value = input(0, { transform: (v: unknown) => coerceNumber(v) });
  unit = input('', { transform: (v: unknown) => coerceString(v) });
  valueMin = input(Number.MIN_VALUE, { transform: (v: unknown) => coerceNumber(v, Number.MIN_VALUE) });
  valueMax = input(Number.MAX_VALUE, { transform: (v: unknown) => coerceNumber(v, Number.MAX_VALUE) });
  valueChanged = output<number>();

  // ── Actions ──
  valueChange(v: number): void { this.valueChanged.emit(clampNumber(coerceNumber(v), this.valueMin(), this.valueMax())); }
}