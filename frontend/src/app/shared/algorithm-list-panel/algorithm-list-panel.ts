import { Component, input, model, output } from '@angular/core';
import { ToggleSwitchComponent } from '../toggle-switch/toggle-switch';
import { coerceBoolean, coerceString } from '../utils/coerce.utils';

@Component({
  selector: 'app-algorithm-list-panel',
  standalone: true,
  imports: [ToggleSwitchComponent],
  templateUrl: './algorithm-list-panel.html',
  styleUrl: './algorithm-list-panel.scss',
})
export class AlgorithmListPanelComponent {

  multipleSelection = input(false, { transform: (v: unknown) => coerceBoolean(v) });
  multipleSelectionTitle = input('', { transform: (v: unknown) => coerceString(v) });
  multipleSelectionActive = model<boolean>(false);
  multipleSelectionValueChanged = output<boolean>();
  multipleSelectionValueChange(v: boolean): void { this.multipleSelectionValueChanged.emit(coerceBoolean(v)); }

  disabled = input(false, { transform: (v: unknown) => coerceBoolean(v) });

  label = input('', { transform: (v: unknown) => coerceString(v) });

  names = input<string[]>([]);
  namesSelected = model<string[]>([]);

  nameTitle = input('', { transform: (v: unknown) => coerceString(v) });
  informationTitle = input('', { transform: (v: unknown) => coerceString(v) });

  nameClicked = model<string>('');
  onNameUpdate(v: string): void {
    if(this.nameClicked() !== v)
      this.nameClicked.set(v);
    else if(this.namesSelected().length > 1)
      this.nameClicked.set('');
  }
  
}
