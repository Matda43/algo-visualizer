import { Component, input } from "@angular/core";
import { CharacterButtonComponent } from "../button/character-button/character-button";
import { InputComponent } from "../io/input/input";
import { NumberInputComponent } from "../io/input/number-input/number-input";
import { SelectOptionComponent } from "../select-option/select-option";
import { SliderComponent } from "../slider/slider";
import { ToggleSwitchComponent } from "../toggle-switch/toggle-switch";
import { GridElementListComponent } from "../grid-element-list/grid-element-list";
import { ControlConfig, ElementListControlConfig } from "../control-config.model";
import { GridElement } from "../../features/pathfinding/models/pathfinding.models";
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
    GridElementListComponent,
  ],
  templateUrl: './dynamic-controls.html',
  styleUrl:    './dynamic-controls.scss',
})
export class DynamicControlsComponent {
  label    = input<string>();
  controls = input.required<ControlConfig[][]>();

  // ── Helpers typés pour les nouveaux types ──────────────────────────────────

  asElementList(control: ControlConfig): ElementListControlConfig {
    return control as ElementListControlConfig;
  }

  onElementsChange(control: ControlConfig, elements: GridElement[]): void {
    (control as ElementListControlConfig).onElementsChange(elements);
  }

  onElementSelected(control: ControlConfig, element: GridElement): void {
    (control as ElementListControlConfig).onSelectedChange(element);
  }
}