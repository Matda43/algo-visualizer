import { Component, input, model } from '@angular/core';
import { coerceBoolean, coerceString } from '../utils/coerce.utils';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitchComponent {
  
  active = model<boolean>(false);
  disabled = input(false, { transform: (v: unknown) => coerceBoolean(v) });
  label = input('', { transform: (v: unknown) => coerceString(v) });
  title = input('', { transform: (v: unknown) => coerceString(v) })

  toggle(): void {
    if (!this.disabled())
      this.active.update(value => !value);
  }
}