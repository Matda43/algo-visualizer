import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { AlgoMetadata } from '../models/algo-metadata.model';

@Injectable({ providedIn: 'root' })
export class AlgoMetadataService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/algorithms';

  private cache$: Observable<AlgoMetadata[]> | null = null;

  getAll(): Observable<AlgoMetadata[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<AlgoMetadata[]>(this.baseUrl).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  getOne(name: string): Observable<AlgoMetadata> {
    return this.http.get<AlgoMetadata>(`${this.baseUrl}/${encodeURIComponent(name)}`);
  }
}