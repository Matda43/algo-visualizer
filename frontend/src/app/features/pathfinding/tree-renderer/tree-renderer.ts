import { Component, input, computed } from '@angular/core';

export interface TreeEdge { from: number; to: number; }

interface TreeNode {
  id:       number;
  x:        number;
  y:        number;
  children: number[];
}

@Component({
  selector:    'app-tree-renderer',
  standalone:  true,
  templateUrl: './tree-renderer.html',
  styleUrl:    './tree-renderer.scss',
})
export class TreeRendererComponent {

  vertexCount = input.required<number>();
  edges       = input.required<TreeEdge[]>();

  visitedVertices  = input<Set<number>>(new Set());
  frontierVertices = input<Set<number>>(new Set());
  pathVertices     = input<Set<number>>(new Set());

  private readonly SVG_WIDTH    = 800;
  private readonly SVG_HEIGHT   = 500;
  private readonly VERTEX_RADIUS = 20;
  private readonly LEVEL_HEIGHT  = 80;

  treeNodes = computed((): TreeNode[] => {
    const n = this.vertexCount();
    if (n === 0) return [];
    return this.buildLayout(n, this.edges());
  });

  treeEdgesResolved = computed(() => {
    const nodes = this.treeNodes();
    return this.edges().map(edge => {
      const from = nodes[edge.from];
      const to   = nodes[edge.to];
      if (!from || !to) return null;
      return { from, to, key: `${edge.from}-${edge.to}` };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  });

  private buildLayout(n: number, edges: TreeEdge[]): TreeNode[] {
    // Construction de la liste d'adjacence
    const adjacency: number[][] = Array.from({ length: n }, () => []);
    const inDegree = new Array<number>(n).fill(0);

    for (const edge of edges) {
      if (edge.from < n && edge.to < n) {
        adjacency[edge.from].push(edge.to);
        inDegree[edge.to]++;
      }
    }

    // Racine = sommet avec degré entrant 0 (ou 0 si aucun)
    const root = inDegree.findIndex(degree => degree === 0);
    const rootId = root === -1 ? 0 : root;

    // BFS pour déterminer les niveaux
    const levels: number[][] = [];
    const visited = new Set<number>();
    let currentLevel = [rootId];
    visited.add(rootId);

    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      const nextLevel: number[] = [];
      for (const nodeId of currentLevel) {
        for (const childId of adjacency[nodeId]) {
          if (!visited.has(childId)) {
            visited.add(childId);
            nextLevel.push(childId);
          }
        }
      }
      currentLevel = nextLevel;
    }

    // Ajouter les sommets non visités (graphe déconnecté)
    for (let vertexId = 0; vertexId < n; vertexId++) {
      if (!visited.has(vertexId)) {
        levels.push([vertexId]);
      }
    }

    // Positionnement
    const nodes: TreeNode[] = new Array(n);
    levels.forEach((levelNodes, levelIndex) => {
      const levelWidth = this.SVG_WIDTH / (levelNodes.length + 1);
      levelNodes.forEach((nodeId, positionInLevel) => {
        nodes[nodeId] = {
          id:       nodeId,
          x:        levelWidth * (positionInLevel + 1),
          y:        60 + levelIndex * this.LEVEL_HEIGHT,
          children: adjacency[nodeId],
        };
      });
    });

    return nodes;
  }

  vertexClass(vertexId: number): string {
    if (this.pathVertices().has(vertexId))     return 'vertex vertex--path';
    if (this.visitedVertices().has(vertexId))  return 'vertex vertex--visited';
    if (this.frontierVertices().has(vertexId)) return 'vertex vertex--frontier';
    return 'vertex';
  }
}