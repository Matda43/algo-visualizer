import { Component, input, output } from "@angular/core";
import { BaseHTMLElementPropertiesComponent } from "../base-html-element-properties";

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

@Component({
  selector:    'app-select-option',
  standalone:  true,
  imports:     [],
  templateUrl: './select-option.html',
  styleUrl:    './select-option.scss',
})
export class SelectOptionComponent extends BaseHTMLElementPropertiesComponent {

  // ── Value ──
  options = input<SelectOption[]>([]);
  normalizedOptions(): SelectOption[] { 
    return this.options().map(option => typeof option === 'string' ? { label: option, value: option } : option ) 
  };
  value = input<string>();
  valueChanged = output<string>();

  // ── Actions ──
  valueChange(v: string): void { this.valueChanged.emit(v); }

}