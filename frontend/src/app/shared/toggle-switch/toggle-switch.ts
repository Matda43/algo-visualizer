import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitchComponent {
  active   = model<boolean>(false);
  disabled = input<boolean>(false);
  label    = input<string>('');

  toggle(): void {
    if (this.disabled()) return;
    this.active.update(value => !value);
  }
}