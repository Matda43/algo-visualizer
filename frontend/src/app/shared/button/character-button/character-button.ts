import { Component, input, output } from "@angular/core";
import { coerceString } from "../../utils/coerce.utils";
import { BaseHTMLElementPropertiesComponent } from "../../base-html-element-properties";

@Component({
  selector:    'app-character-button',
  standalone:  true,
  imports:     [],
  templateUrl: './character-button.html',
  styleUrl:    './character-button.scss',
})
export class CharacterButtonComponent extends BaseHTMLElementPropertiesComponent {

  // ── Button ──
  clicked = output<void>();
  character = input('', { transform: (v: unknown) => coerceString(v) });

  // ── Actions ──
  click(): void { this.clicked.emit(); }

}