import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GeneratedGrid, GeneratedGraph,
  WallGenerationMode, TerrainGenerationMode,
  GraphEdge,
} from '../models/pathfinding.models';

interface GridGenerationRequest {
  terrainType: string;
  wallType:    string;
  rows:        number;
  cols:        number;
  density:     number;
}

interface GraphGenerationRequest {
  vertexCount: number;
  directed:    boolean;
  tree:        boolean;
  minWeight:   number;
  maxWeight:   number;
}

interface GraphValidationRequest {
  vertexCount: number;
  edges:       GraphEdge[];
  directed:    boolean;
  expectTree:  boolean;
  algorithm:   string;
}

@Injectable({ providedIn: 'root' })
export class PathfindingGenerationService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/pathfinding/generate';

  /**
   * Génère une grille en combinant terrain + murs côté backend.
   * Passer 'none' pour l'un ou l'autre si pas souhaité.
   */
  generateGrid(
    terrainType: TerrainGenerationMode | 'none',
    wallType:    WallGenerationMode    | 'none',
    rows:        number,
    cols:        number,
    density    = 0.3,
  ): Observable<GeneratedGrid> {
    const body: GridGenerationRequest = { terrainType, wallType, rows, cols, density };
    return this.http.post<GeneratedGrid>(`${this.baseUrl}/grid`, body);
  }

  generateGraph(
    vertexCount: number,
    directed:    boolean,
    tree:        boolean,
    minWeight  = 1.0,
    maxWeight  = 10.0,
  ): Observable<GeneratedGraph> {
    const body: GraphGenerationRequest = { vertexCount, directed, tree, minWeight, maxWeight };
    return this.http.post<GeneratedGraph>(`${this.baseUrl}/graph`, body);
  }

  validateGraph(
    vertexCount: number,
    edges:       GraphEdge[],
    directed:    boolean,
    expectTree:  boolean,
    algorithm:   string,
  ): Observable<string[]> {
    const body: GraphValidationRequest = { vertexCount, edges, directed, expectTree, algorithm };
    return this.http.post<string[]>(`${this.baseUrl}/validate`, body);
  }
}