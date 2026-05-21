import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PathfindingMetadata } from '../models/pathfinding.models';

@Injectable({ providedIn: 'root' })
export class PathfindingMetadataService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/pathfinding';

  private cache$: Observable<PathfindingMetadata[]> | null = null;

  getAll(): Observable<PathfindingMetadata[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<PathfindingMetadata[]>(this.baseUrl).pipe(shareReplay(1));
    }
    return this.cache$;
  }
}