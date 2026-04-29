import { Routes } from '@angular/router';
import { SortingComponent } from './features/sorting/sorting';

export const routes: Routes = [
  { path: '', redirectTo: 'sorting', pathMatch: 'full' },
  { path: 'sorting', component: SortingComponent },
];