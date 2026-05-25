import { Routes } from '@angular/router';
import { SortingComponent } from './features/sorting/sorting';
import { PathfindingComponent } from './features/pathfinding/pathfinding';

export const routes: Routes = [
  { path: '', redirectTo: 'sorting', pathMatch: 'full' },
  { path: 'sorting', component: SortingComponent },
  { path: 'pathfinding', component: PathfindingComponent },
];