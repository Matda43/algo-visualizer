import { Component, input, output } from "@angular/core";
import { coerceBoolean, coerceString } from "../../utils/coerce.utils";

@Component({
  selector:    'app-character-button',
  standalone:  true,
  imports:     [],
  templateUrl: './character-button.html',
  styleUrl:    './character-button.scss',
})
export class CharacterButtonComponent {

  // ── Label ──
  label = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Button ──
  disabled = input(false, { transform: coerceBoolean });
  clicked = output<void>();
  title = input('', { transform: (v: unknown) => coerceString(v) });
  character = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Actions ──
  click(): void { this.clicked.emit(); }

}