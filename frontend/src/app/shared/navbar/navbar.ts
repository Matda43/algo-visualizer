import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path:      string;
  label:     string;
  tag?:      string;
  available: boolean;
}

@Component({
  selector:    'app-navbar',
  standalone:  true,
  imports:     [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl:    './navbar.scss',
})
export class NavbarComponent {
  navItems = signal<NavItem[]>([
    { path: '/sorting',     label: 'Tri',          available: true  },
    { path: '/pathfinding', label: 'Pathfinding',  available: true  },
    { path: '/compare',     label: 'Comparaison',   tag: 'Bientôt',  available: false },
  ]);
}