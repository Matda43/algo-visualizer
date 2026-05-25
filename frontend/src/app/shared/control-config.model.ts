import { SelectOption } from "./select-option/select-option";
import { GridElement } from "../features/pathfinding/models/pathfinding.models";

export type ControlConfig =
  | EmptyControlConfig 
  | SelectControlConfig
  | ToggleControlConfig
  | InputControlConfig
  | CharacterButtonControlConfig
  | ToolButtonsControlConfig
  | NumberInputControlConfig
  | SliderControlConfig
  | ElementListControlConfig
  | ValidationErrorsControlConfig;

export interface BaseControlConfig {
  type:      string;
  hidden?:   boolean;
  label?:    string;
  title?:    string;
  disabled?: boolean;
}

export interface SelectControlConfig extends BaseControlConfig {
  type: 'select';
  value: string;
  valueChanged: (value: string) => void;
  options: SelectOption<string>[];
}

export interface ToggleControlConfig extends BaseControlConfig {
  type: 'toggle';
  active: boolean;
  activeChange: (value: boolean) => void;
}

export interface InputControlConfig extends BaseControlConfig {
  type: 'input';
  value: string;
  placeholder?: string;
  rows?: number;
  valueChanged?: (value: string) => void;
  blured?: () => void;
}

export interface CharacterButtonControlConfig extends BaseControlConfig {
  type: 'character-button';
  character: string;
  clicked: () => void;
}

/** Boutons d'outils avec icône + label, mutuellement exclusifs */
export interface ToolButtonsControlConfig extends BaseControlConfig {
  type: 'tool-buttons';
  tools: { key: string; icon: string; label: string }[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export interface NumberInputControlConfig extends BaseControlConfig {
  type: 'number-input';

  canDec?: boolean;
  decTitle?: string;
  decClicked?: () => void;
  decDisabled?: boolean;

  valueMin?: number;
  value: number;
  valueMax?: number;
  valueChanged: (value: number) => void;
  valueDisabled?: boolean;

  canInc?: boolean;
  incTitle?: string;
  incClicked?: () => void;
  incDisabled?: boolean;
}

export interface SliderControlConfig extends BaseControlConfig {
  type: 'slider';
  value: number;
  valueMin: number;
  valueMax: number;
  unit?: string;
  description?: string;
  valueChanged: (value: number) => void;
}

/** Liste d'éléments de grille — rendu par GridElementListComponent */
export interface ElementListControlConfig extends BaseControlConfig {
  type: 'element-list';
  elements: GridElement[];
  selectedElement: GridElement;
  onElementsChange: (elements: GridElement[]) => void;
  onSelectedChange: (element: GridElement) => void;
}

/** Bloc d'erreurs de validation */
export interface ValidationErrorsControlConfig extends BaseControlConfig {
  type: 'validation-errors';
  errors: string[];
}

export interface EmptyControlConfig extends BaseControlConfig {
  type: 'empty';
}