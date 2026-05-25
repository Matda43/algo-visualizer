import { Component, model, output } from '@angular/core';
import { GridElement, WALL_ELEMENT } from '../../features/pathfinding/models/pathfinding.models';
import { BaseHTMLElementPropertiesComponent } from '../base-html-element-properties';

@Component({
  selector:    'app-grid-element-list',
  standalone:  true,
  templateUrl: './grid-element-list.html',
  styleUrl:    './grid-element-list.scss',
})
export class GridElementListComponent extends BaseHTMLElementPropertiesComponent {

  elements        = model.required<GridElement[]>();
  selectedElement = model.required<GridElement>();

  infinity: number = Number.POSITIVE_INFINITY;

  getValue(v: number): string {
    if(v === this.infinity){
      console.log("valeur = " + v);
      return '∞';
    }else{
      return v.toString();
    }
  }

  /** Émis quand l'utilisateur clique sur un élément — le parent doit activer drawMode='element' */
  selectedChange = output<GridElement>();

  selectElement(element: GridElement): void {
    this.selectedElement.set(element);
    this.selectedChange.emit(element);
  }

  addElement(): void {
    const newElement: GridElement = {
      name:           `Élément ${this.elements().length + 1}`,
      hexColor:       '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
      cardinalWeight: 1,
      deletable:      true,
    };
    this.elements.update(list => [...list, newElement]);
  }

  removeElement(element: GridElement, event: MouseEvent): void {
    event.stopPropagation();
    if (!element.deletable) return;
    this.elements.update(list => list.filter(e => e !== element));
    if (this.selectedElement() === element) {
      const fallback = this.elements()[0] ?? WALL_ELEMENT;
      this.selectedElement.set(fallback);
      this.selectedChange.emit(fallback);
    }
  }

  updateName(element: GridElement, name: string, event: Event): void {
    event.stopPropagation();
    this.elements.update(list =>
      list.map(e => e === element ? { ...e, name } : e)
    );
    if (this.selectedElement() === element) {
      this.selectedElement.update(e => ({ ...e, name }));
    }
  }

  updateColor(element: GridElement, hexColor: string, event: Event): void {
    event.stopPropagation();
    this.elements.update(list =>
      list.map(e => e === element ? { ...e, hexColor } : e)
    );
    if (this.selectedElement() === element) {
      this.selectedElement.update(e => ({ ...e, hexColor }));
    }
  }

  updateWeight(element: GridElement, cardinalWeight: number, event: Event): void {
    event.stopPropagation();
    const safeWeight = Math.max(0.1, cardinalWeight);
    this.elements.update(list =>
      list.map(e => e === element ? { ...e, cardinalWeight: safeWeight } : e)
    );
    if (this.selectedElement() === element) {
      this.selectedElement.update(e => ({ ...e, cardinalWeight: safeWeight }));
    }
  }
}