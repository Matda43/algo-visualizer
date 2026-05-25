import { Component, input } from "@angular/core";
import { coerceBoolean, coerceString } from "./utils/coerce.utils";

@Component({
  standalone: true,
  template: ''
})
export class BaseHTMLElementPropertiesComponent {

    label = input('', { transform: (v: unknown) => coerceString(v) });
    title = input('', { transform: (v: unknown) => coerceString(v) });

    disabled = input(false, { transform: (v: unknown) => coerceBoolean(v) });
}