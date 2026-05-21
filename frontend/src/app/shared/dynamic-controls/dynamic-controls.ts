import { Component, input } from "@angular/core";
import { CharacterButtonComponent } from "../button/character-button/character-button";
import { InputComponent } from "../io/input/input";
import { NumberInputComponent } from "../io/input/number-input/number-input";
import { SelectOptionComponent } from "../select-option/select-option";
import { SliderComponent } from "../slider/slider";
import { ToggleSwitchComponent } from "../toggle-switch/toggle-switch";
import { ControlConfig } from "../control-config.model";

@Component({
  selector: 'app-dynamic-controls',
  standalone: true,
  imports: [
    SelectOptionComponent,
    ToggleSwitchComponent,
    InputComponent,
    CharacterButtonComponent,
    NumberInputComponent,
    SliderComponent,
  ],
  templateUrl: './dynamic-controls.html',
  styleUrl:    './dynamic-controls.scss',
})
export class DynamicControlsComponent {

  label = input<string>();
  controls = input.required<ControlConfig[][]>();

}