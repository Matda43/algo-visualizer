import { Component, model } from '@angular/core';
import { BaseHTMLElementPropertiesComponent } from '../base-html-element-properties';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitchComponent extends BaseHTMLElementPropertiesComponent {
  
  active = model<boolean>(false);

  toggle(): void {
    if (!this.disabled()){
      this.active.update(value => !value);
    }
  }
}